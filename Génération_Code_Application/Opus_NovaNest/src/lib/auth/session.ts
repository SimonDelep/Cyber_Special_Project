import type { AstroCookies } from 'astro';
import {
  createSession,
  deleteSession,
  getSessionUser,
} from '../db/sessions';
import type { SafeUser } from '../db/schema';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from './constants';

export function setSessionCookie(
  cookies: AstroCookies,
  sessionId: string,
): void {
  cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionIdFromCookies(cookies: AstroCookies): string | null {
  return cookies.get(SESSION_COOKIE)?.value ?? null;
}

export function loginUser(
  cookies: AstroCookies,
  userId: number,
): { sessionId: string; user: SafeUser } {
  const { id } = createSession(userId);
  const user = getSessionUser(id);
  if (!user) throw new Error('Session creation failed');
  setSessionCookie(cookies, id);
  return { sessionId: id, user };
}

export function logoutUser(cookies: AstroCookies): void {
  const sessionId = getSessionIdFromCookies(cookies);
  if (sessionId) deleteSession(sessionId);
  clearSessionCookie(cookies);
}

export function resolveUserFromCookies(
  cookies: AstroCookies,
): SafeUser | null {
  const sessionId = getSessionIdFromCookies(cookies);
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}
