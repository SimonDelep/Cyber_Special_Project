import type { APIRoute } from 'astro';
import {
  buildClearSessionCookie,
  destroySession,
  getTokenFromCookie,
  getSessionUser,
} from '@/lib/auth/session';
import { isSecureRequest, redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const token = getTokenFromCookie(request.headers.get('cookie'));
  const sessionUser = locals.user ?? (token ? await getSessionUser(token) : null);

  if (token) await destroySession(token);

  if (sessionUser) {
    await logEvent({
      eventType: EventType.AUTH_LOGOUT,
      severity: 'info',
      message: `User "${sessionUser.username}" logged out`,
      userId: sessionUser.id,
      username: sessionUser.username,
      request,
    });
  }

  const secure = isSecureRequest(request);
  return redirectResponse('/', [buildClearSessionCookie(secure)]);
};
