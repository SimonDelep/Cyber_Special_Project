import type { APIRoute } from 'astro';
import {
  clearSessionCookie,
  destroySession,
  getSessionIdFromCookies,
} from '@/lib/auth/session';
import { jsonResponse } from '@/lib/api';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const sessionId = getSessionIdFromCookies(cookies);
  if (sessionId) {
    destroySession(sessionId);
  }
  clearSessionCookie(cookies);

  logEvent({
    action: LOG_ACTIONS.AUTH_LOGOUT,
    category: 'auth',
    status: 'success',
    message: locals.user
      ? `User "${locals.user.username}" signed out`
      : 'Session ended (logout)',
    userId: locals.user?.id ?? null,
    username: locals.user?.username ?? null,
    request,
  });

  return jsonResponse({ ok: true });
};
