import type { APIRoute } from 'astro';
import { verifyPassword } from '../../../lib/auth/password';
import { findUserByUsername } from '../../../lib/db/users';
import { loginUser } from '../../../lib/auth/session';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{
    username?: string;
    password?: string;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';

  if (!username || !password) {
    return errorResponse('Username and password are required.');
  }

  const user = findUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    logEvent({
      category: EVENT_CATEGORY.AUTH,
      action: EVENT_ACTION.LOGIN,
      outcome: EVENT_OUTCOME.FAILURE,
      message: `Failed login attempt for username "${username}".`,
      username,
      request,
      metadata: { reason: 'invalid_credentials' },
    });
    return errorResponse('Invalid username or password.', 401);
  }

  const { user: sessionUser } = loginUser(cookies, user.id);
  logEvent({
    category: EVENT_CATEGORY.AUTH,
    action: EVENT_ACTION.LOGIN,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `User "${user.username}" signed in.`,
    userId: user.id,
    username: user.username,
    request,
  });
  return jsonResponse({ user: sessionUser });
};
