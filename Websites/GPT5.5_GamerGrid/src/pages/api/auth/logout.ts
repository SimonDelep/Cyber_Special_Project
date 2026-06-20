import type { APIRoute } from 'astro';
import { destroySession, getUserFromSession } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async ({ cookies, request }) => {
  const user = await getUserFromSession(cookies);
  await destroySession(cookies);
  if (user) {
    await logEvent({
      category: 'auth',
      action: EventAction.LOGOUT,
      severity: 'info',
      status: 'success',
      message: `User ${user.username} signed out.`,
      userId: user.id,
      username: user.username,
      request,
    });
  }
  return jsonResponse({ ok: true });
};
