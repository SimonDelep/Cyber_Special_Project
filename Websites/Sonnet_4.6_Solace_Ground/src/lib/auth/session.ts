import { randomBytes } from 'node:crypto';
import { eq, and, gt } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from './constants';
import { toPublicUser, type PublicUser } from '@/types/auth';

function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export function createSession(userId: number): string {
  const db = getDb();
  const id = generateSessionId();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;

  db.insert(sessions).values({ id, userId, expiresAt }).run();
  return id;
}

export function destroySession(sessionId: string): void {
  const db = getDb();
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function destroyAllUserSessions(userId: number): void {
  const db = getDb();
  db.delete(sessions).where(eq(sessions.userId, userId)).run();
}

export function getUserBySessionId(sessionId: string): PublicUser | null {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const row = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      balanceCents: users.balanceCents,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get();

  return row ? toPublicUser(row) : null;
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string): void {
  cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionIdFromCookies(cookies: AstroCookies): string | undefined {
  return cookies.get(SESSION_COOKIE)?.value;
}
