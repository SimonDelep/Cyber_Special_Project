import { createHash, randomBytes } from "node:crypto";
import type { AstroCookies } from "astro";
import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import type { AuthUser } from "@/types/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_DAYS,
} from "@/lib/auth/constants";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.displayName,
    email: row.email,
    avatarUrl: row.avatarUrl,
    balanceCents: row.balanceCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function purgeExpiredSessions() {
  const db = getDb();
  db.delete(sessions).where(lt(sessions.expiresAt, new Date())).run();
}

export function createSession(userId: number, cookies: AstroCookies): AuthUser {
  const db = getDb();
  const token = createToken();
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );

  db.insert(sessions)
    .values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    })
    .run();

  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found after session creation.");
  return toAuthUser(user);
}

export function getSessionUser(cookies: AstroCookies): AuthUser | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  purgeExpiredSessions();

  const db = getDb();
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .get();

  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) {
      db.delete(sessions).where(eq(sessions.id, session.id)).run();
    }
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return null;
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  return user ? toAuthUser(user) : null;
}

export function destroySession(cookies: AstroCookies): void {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    db.delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)))
      .run();
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export function getCurrentUser(cookies: AstroCookies): AuthUser | null {
  return getSessionUser(cookies);
}

/** API routes may not receive middleware locals; always fall back to the session cookie. */
export function resolveAuthUser(
  locals: App.Locals,
  cookies: AstroCookies,
): AuthUser | null {
  return locals.authUser ?? getSessionUser(cookies);
}

export function destroyAllUserSessions(userId: number): void {
  const db = getDb();
  db.delete(sessions).where(eq(sessions.userId, userId)).run();
}
