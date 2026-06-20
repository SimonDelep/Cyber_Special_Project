import type { APIRoute } from 'astro';
import { createSession } from '@/lib/auth/session';
import { registerUser } from '@/lib/auth/user';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{
    username?: string;
    email?: string;
    password?: string;
    displayName?: string;
  }>(request);

  if (body instanceof Response) return body;

  const { username, email, password, displayName } = body;
  if (!username || !email || !password || !displayName) {
    return errorResponse('Username, email, password, and display name are required.');
  }

  try {
    const user = await registerUser({ username, email, password, displayName });
    await createSession(user.id, cookies);
    await logEvent({
      category: 'auth',
      action: EventAction.REGISTER_SUCCESS,
      severity: 'info',
      status: 'success',
      message: `New account registered: ${user.username}.`,
      userId: user.id,
      username: user.username,
      metadata: { email: user.email },
      request,
    });
    return jsonResponse({ user }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    await logEvent({
      category: 'auth',
      action: EventAction.REGISTER_FAILURE,
      severity: 'warning',
      status: 'failure',
      message: `Registration failed for "${username}": ${message}`,
      username,
      request,
    });
    return errorResponse(message, 400);
  }
};
