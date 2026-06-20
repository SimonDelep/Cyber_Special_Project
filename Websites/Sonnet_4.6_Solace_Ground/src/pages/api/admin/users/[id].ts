import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { destroyAllUserSessions } from '@/lib/auth/session';
import { deleteLocalAvatar } from '@/lib/auth/avatar';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { validateAdminUserUpdate } from '@/lib/admin/validation';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

function parseUserId(params: APIRoute['params']): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const userId = parseUserId(params);
  if (!userId) return errorResponse('Invalid user id.', 400);

  const body = await parseJsonBody<{
    username?: string;
    email?: string;
    role?: string;
    displayName?: string;
    bio?: string;
    balanceCents?: number;
    balanceAdjustmentCents?: number;
  }>(request);

  if (!body) return errorResponse('Invalid request body.', 400);

  const errors = validateAdminUserUpdate(body);
  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const current = db.select().from(users).where(eq(users.id, userId)).get();
  if (!current) return errorResponse('User not found.', 404);

  if (body.role === 'user' && current.role === 'admin') {
    const adminCount = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .all().length;
    if (adminCount <= 1) {
      return errorResponse('Cannot demote the last administrator.', 400);
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.username !== undefined) updates.username = body.username.trim();
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
  if (body.role !== undefined) updates.role = body.role as 'user' | 'admin';
  if (body.displayName !== undefined) {
    updates.displayName = body.displayName.trim() || null;
  }
  if (body.bio !== undefined) updates.bio = body.bio.trim() || null;

  if (body.balanceCents !== undefined) {
    updates.balanceCents = body.balanceCents;
  } else if (body.balanceAdjustmentCents !== undefined) {
    updates.balanceCents = Math.max(
      0,
      current.balanceCents + body.balanceAdjustmentCents,
    );
  }

  if (updates.username) {
    const taken = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, updates.username))
      .get();
    if (taken && taken.id !== userId) {
      return errorResponse('Username already taken.', 409);
    }
  }

  if (updates.email) {
    const taken = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, updates.email))
      .get();
    if (taken && taken.id !== userId) {
      return errorResponse('Email already taken.', 409);
    }
  }

  const updated = db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning()
    .get();

  logEvent({
    action: LOG_ACTIONS.ADMIN_USER_UPDATE,
    category: 'admin',
    status: 'success',
    message: `Admin updated user ${updated.username}`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: {
      targetUserId: userId,
      targetUsername: updated.username,
      previousBalanceCents: current.balanceCents,
      newBalanceCents: updated.balanceCents,
      fields: Object.keys(updates).filter((k) => k !== 'updatedAt'),
    },
  });

  return jsonResponse({ user: toPublicUser(updated) });
};

export const DELETE: APIRoute = ({ params, request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const userId = parseUserId(params);
  if (!userId) return errorResponse('Invalid user id.', 400);

  if (userId === admin.id) {
    return errorResponse('You cannot delete your own account from the admin panel.', 400);
  }

  const db = getDb();
  const current = db.select().from(users).where(eq(users.id, userId)).get();
  if (!current) return errorResponse('User not found.', 404);

  if (current.role === 'admin') {
    const adminCount = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .all().length;
    if (adminCount <= 1) {
      return errorResponse('Cannot delete the last administrator.', 400);
    }
  }

  logEvent({
    action: LOG_ACTIONS.ADMIN_USER_DELETE,
    category: 'admin',
    status: 'success',
    severity: 'warning',
    message: `Admin deleted user ${current.username}`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { targetUserId: userId, targetUsername: current.username },
  });

  deleteLocalAvatar(current.avatarUrl);
  destroyAllUserSessions(userId);
  db.delete(users).where(eq(users.id, userId)).run();

  return jsonResponse({ ok: true });
};
