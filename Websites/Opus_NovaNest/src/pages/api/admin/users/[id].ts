import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../../lib/api/admin-guard';
import {
  validateEmail,
  validateDisplayName,
} from '../../../../lib/auth/validation';
import { ROLES, type UserRole } from '../../../../lib/auth/constants';
import {
  adminUpdateUser,
  deleteUser,
  findUserByEmail,
  findUserById,
} from '../../../../lib/db/users';
import { deleteSessionsForUser } from '../../../../lib/db/sessions';
import { deleteUploadedAvatar } from '../../../../lib/auth/avatar';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../../lib/api/response';
import { logEvent } from '../../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../../lib/events/constants';

function parseUserId(params: { id?: string }): number | null {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const userId = parseUserId(params);
  if (!userId) return errorResponse('Invalid user id.');

  const target = findUserById(userId);
  if (!target) return errorResponse('User not found.', 404);

  const body = await parseJsonBody<{
    email?: string;
    displayName?: string;
    role?: string;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const email = body.email ?? target.email;
  const displayName = body.displayName ?? target.displayName;
  const role = (body.role ?? target.role) as UserRole;

  const errors = [validateEmail(email), validateDisplayName(displayName)].filter(
    Boolean,
  );
  if (errors.length > 0) return errorResponse(errors[0]!);

  if (role !== ROLES.USER && role !== ROLES.ADMIN) {
    return errorResponse('Role must be "user" or "admin".');
  }

  if (userId === admin.id && role !== ROLES.ADMIN) {
    return errorResponse('You cannot remove your own admin role.');
  }

  const emailTaken = findUserByEmail(email);
  if (emailTaken && emailTaken.id !== userId) {
    return errorResponse('Email is already in use.', 409);
  }

  const updated = adminUpdateUser(userId, { email, displayName, role });
  if (!updated) return errorResponse('Failed to update user.', 500);

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_USER_UPDATE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" updated user "${target.username}" (id ${userId}).`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { targetUserId: userId, targetUsername: target.username, role },
  });

  return jsonResponse({ user: updated });
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const userId = parseUserId(params);
  if (!userId) return errorResponse('Invalid user id.');

  if (userId === admin.id) {
    return errorResponse('You cannot delete your own account from the admin panel.');
  }

  const target = findUserById(userId);
  if (!target) return errorResponse('User not found.', 404);

  if (target.avatarUrl?.startsWith('/uploads/avatars/')) {
    deleteUploadedAvatar(target.avatarUrl);
  }

  deleteSessionsForUser(userId);
  deleteUser(userId);

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_USER_DELETE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" deleted user "${target.username}" (id ${userId}).`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { targetUserId: userId, targetUsername: target.username },
  });

  return jsonResponse({ ok: true });
};
