import type { APIRoute } from 'astro';
import { createSession } from '@/lib/auth/session';
import { authenticateUser } from '@/lib/auth/user';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{ username?: string; password?: string }>(request);
  if (body instanceof Response) return body;

  const { username, password } = body;
  if (!username || !password) {
    return errorResponse('Username and password are required.');
  }

  const user = await authenticateUser(username, password);
  if (!user) {
    await logEvent({
      category: 'auth',
      action: EventAction.LOGIN_FAILURE,
      severity: 'warning',
      status: 'failure',
      message: `Failed login attempt for "${username}".`,
      username,
      request,
    });
    return errorResponse('Invalid username or password.', 401);
  }

  await createSession(user.id, cookies);
  await logEvent({
    category: 'auth',
    action: EventAction.LOGIN_SUCCESS,
    severity: 'info',
    status: 'success',
    message: `User ${user.username} signed in.`,
    userId: user.id,
    username: user.username,
    request,
  });
  return jsonResponse({ user });
};
