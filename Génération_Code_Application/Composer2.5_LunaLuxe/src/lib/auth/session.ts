import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import { sessions, type PublicUser } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { SESSION_MAX_AGE_MS, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/auth/constants';
import { findUserById, toPublicUser } from '@/lib/auth/users';

export type SessionUser = PublicUser;

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_MS).toISOString();

  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  });

  return token;
}

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await destroySession(token);
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    await destroySession(token);
    return null;
  }

  return toPublicUser(user);
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function destroyAllUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}

export function buildSessionCookie(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}
