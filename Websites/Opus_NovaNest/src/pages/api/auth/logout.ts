import type { APIRoute } from 'astro';
import { logoutUser, resolveUserFromCookies } from '../../../lib/auth/session';
import { jsonResponse } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  logoutUser(cookies);
  if (user) {
    logEvent({
      category: EVENT_CATEGORY.AUTH,
      action: EVENT_ACTION.LOGOUT,
      outcome: EVENT_OUTCOME.SUCCESS,
      message: `User "${user.username}" signed out.`,
      userId: user.id,
      username: user.username,
      request,
    });
  }
  return jsonResponse({ ok: true });
};
