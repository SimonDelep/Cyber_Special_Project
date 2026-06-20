import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  destroyAllUserSessions,
  clearSessionCookie,
  getSessionIdFromCookies,
  destroySession,
} from '@/lib/auth/session';
import { deleteLocalAvatar } from '@/lib/auth/avatar';
import { validatePassword, validateProfileUpdate } from '@/lib/auth/validation';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  if (!locals.user) {
    return errorResponse('Authentication required.', 401);
  }
  return jsonResponse({ user: locals.user });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return errorResponse('Authentication required.', 401);
  }

  const body = await parseJsonBody<{
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }>(request);

  if (!body) {
    return errorResponse('Invalid request body.', 400);
  }

  const errors = validateProfileUpdate({
    username: body.username,
    email: body.email,
    displayName: body.displayName,
    bio: body.bio,
    avatarUrl: body.avatarUrl,
  });

  if (body.newPassword) {
    const pwErr = validatePassword(body.newPassword);
    if (pwErr) errors.newPassword = pwErr;
    if (!body.currentPassword) {
      errors.currentPassword = 'Current password is required to set a new password.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const current = db
    .select()
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();

  if (!current) {
    return errorResponse('User not found.', 404);
  }

  if (body.newPassword) {
    if (
      !body.currentPassword ||
      !(await verifyPassword(body.currentPassword, current.passwordHash))
    ) {
      return errorResponse('Current password is incorrect.', 401);
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.username !== undefined) updates.username = body.username.trim();
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
  if (body.displayName !== undefined) {
    updates.displayName = body.displayName.trim() || null;
  }
  if (body.bio !== undefined) updates.bio = body.bio.trim() || null;
  if (body.avatarUrl !== undefined) {
    const url = body.avatarUrl.trim();
    if (url !== current.avatarUrl) {
      deleteLocalAvatar(current.avatarUrl);
      updates.avatarUrl = url || null;
    }
  }
  if (body.newPassword) {
    updates.passwordHash = await hashPassword(body.newPassword);
  }

  if (updates.username) {
    const taken = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, updates.username))
      .get();
    if (taken && taken.id !== locals.user.id) {
      return errorResponse('Username is already taken.', 409);
    }
  }

  if (updates.email) {
    const taken = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, updates.email))
      .get();
    if (taken && taken.id !== locals.user.id) {
      return errorResponse('Email is already taken.', 409);
    }
  }

  const updated = db
    .update(users)
    .set(updates)
    .where(eq(users.id, locals.user.id))
    .returning()
    .get();

  logEvent({
    action: LOG_ACTIONS.PROFILE_UPDATE,
    category: 'profile',
    status: 'success',
    message: `Profile updated for ${updated.username}`,
    userId: updated.id,
    username: updated.username,
    request,
    metadata: {
      fields: Object.keys(updates).filter((k) => k !== 'updatedAt' && k !== 'passwordHash'),
      passwordChanged: !!body.newPassword,
    },
  });

  return jsonResponse({ user: toPublicUser(updated) });
};

export const DELETE: APIRoute = ({ request, locals, cookies }) => {
  if (!locals.user) {
    return errorResponse('Authentication required.', 401);
  }

  const db = getDb();
  const current = db
    .select()
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();

  if (current) {
    logEvent({
      action: LOG_ACTIONS.PROFILE_DELETE,
      category: 'profile',
      status: 'success',
      severity: 'warning',
      message: `Account deleted: ${current.username}`,
      userId: current.id,
      username: current.username,
      request,
    });
    deleteLocalAvatar(current.avatarUrl);
    destroyAllUserSessions(locals.user.id);
    db.delete(users).where(eq(users.id, locals.user.id)).run();
  }

  const sessionId = getSessionIdFromCookies(cookies);
  if (sessionId) destroySession(sessionId);
  clearSessionCookie(cookies);

  return jsonResponse({ ok: true });
};
