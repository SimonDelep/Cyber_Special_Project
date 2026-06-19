import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import {
  createSession,
  setSessionCookie,
} from '@/lib/auth/session';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{
    username?: string;
    password?: string;
  }>(request);

  if (!body?.username || !body?.password) {
    logEvent({
      action: LOG_ACTIONS.AUTH_LOGIN_FAILED,
      category: 'auth',
      status: 'failure',
      severity: 'warning',
      message: 'Login attempt with missing credentials',
      username: body?.username?.trim() ?? null,
      request,
      metadata: { reason: 'missing_fields' },
    });
    return errorResponse('Username and password are required.', 400);
  }

  const username = body.username.trim();
  const db = getDb();
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    logEvent({
      action: LOG_ACTIONS.AUTH_LOGIN_FAILED,
      category: 'auth',
      status: 'failure',
      severity: 'warning',
      message: `Failed login attempt for username "${username}"`,
      username,
      userId: user?.id ?? null,
      request,
    });
    return errorResponse('Invalid username or password.', 401);
  }

  const sessionId = createSession(user.id);
  setSessionCookie(cookies, sessionId);

  logEvent({
    action: LOG_ACTIONS.AUTH_LOGIN_SUCCESS,
    category: 'auth',
    status: 'success',
    message: `User "${username}" signed in`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { role: user.role },
  });

  return jsonResponse({ user: toPublicUser(user) });
};
