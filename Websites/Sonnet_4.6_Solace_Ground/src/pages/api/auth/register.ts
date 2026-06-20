import type { APIRoute } from 'astro';
import { eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import {
  createSession,
  setSessionCookie,
} from '@/lib/auth/session';
import { validateRegistration } from '@/lib/auth/validation';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>(request);

  if (!body?.username || !body?.email || !body?.password || !body?.confirmPassword) {
    return errorResponse('All fields are required.', 400);
  }

  const errors = validateRegistration({
    username: body.username.trim(),
    email: body.email.trim(),
    password: body.password,
    confirmPassword: body.confirmPassword,
  });

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.username, body.username.trim()),
        eq(users.email, body.email.trim().toLowerCase()),
      ),
    )
    .get();

  if (existing) {
    logEvent({
      action: LOG_ACTIONS.AUTH_REGISTER_FAILED,
      category: 'auth',
      status: 'failure',
      severity: 'warning',
      message: `Registration failed: username or email taken (${body.username.trim()})`,
      username: body.username.trim(),
      request,
    });
    return errorResponse('Username or email is already taken.', 409);
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(body.password);

  const inserted = db
    .insert(users)
    .values({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const sessionId = createSession(inserted.id);
  setSessionCookie(cookies, sessionId);

  logEvent({
    action: LOG_ACTIONS.AUTH_REGISTER_SUCCESS,
    category: 'auth',
    status: 'success',
    message: `New account registered: ${inserted.username}`,
    userId: inserted.id,
    username: inserted.username,
    request,
  });

  return jsonResponse({ user: toPublicUser(inserted) }, 201);
};
