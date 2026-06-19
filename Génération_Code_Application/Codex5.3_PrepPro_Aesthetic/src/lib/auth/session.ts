import { createHash, randomBytes } from "node:crypto";
import type { AstroCookies } from "astro";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { sessions, users, type User } from "@/db/schema";
import type { PublicUser } from "./types";

export const SESSION_COOKIE = "preppro_session";
const SESSION_DAYS = 30;

export function getSessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax" as const,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function sessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date.toISOString();
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    balanceCents: user.balanceCents,
    createdAt: user.createdAt,
  };
}

export async function createSession(
  userId: number,
  cookies: AstroCookies,
): Promise<void> {
  const db = getDb();
  const token = generateToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = sessionExpiry();

  db.insert(sessions)
    .values({
      id: sessionId,
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    })
    .run();

  cookies.set(SESSION_COOKIE, token, {
    ...getSessionCookieOptions(),
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function destroySessionCookie(cookies: AstroCookies): void {
  const options = getSessionCookieOptions();
  cookies.delete(SESSION_COOKIE, options);
  cookies.set(SESSION_COOKIE, "", { ...options, maxAge: 0 });
}

export function getSessionTokenFromCookies(
  cookies: AstroCookies,
): string | undefined {
  return cookies.get(SESSION_COOKIE)?.value;
}

export function resolveUserFromToken(token: string | undefined): PublicUser | null {
  if (!token) return null;

  const db = getDb();
  const now = new Date().toISOString();
  const tokenHash = hashToken(token);

  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)),
    )
    .limit(1)
    .all()[0];

  return row ? toPublicUser(row.user) : null;
}

export function resolveUserFromCookies(
  cookies: AstroCookies,
): PublicUser | null {
  return resolveUserFromToken(getSessionTokenFromCookies(cookies));
}

export function revokeSession(token: string | undefined): void {
  if (!token) return;
  const db = getDb();
  db.delete(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .run();
}

export function revokeAllUserSessions(userId: number): void {
  const db = getDb();
  db.delete(sessions).where(eq(sessions.userId, userId)).run();
}
