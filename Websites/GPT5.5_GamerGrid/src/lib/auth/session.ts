import type { AstroCookies } from 'astro';
import { eq, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { sessions } from '@/db/schema';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { findPublicUserById } from '@/lib/auth/user';
import type { PublicUser } from '@/lib/auth/types';

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

export async function createSession(
  userId: string,
  cookies: AstroCookies,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const sessionId = nanoid(32);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: sessionExpiry(),
    createdAt: now,
  });

  cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function getUserFromSession(
  cookies: AstroCookies,
): Promise<PublicUser | null> {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }

  return findPublicUserById(session.userId);
}

export async function purgeExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
