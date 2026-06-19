import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../lib/auth/session';
import { verifyPassword, hashPassword } from '../../../lib/auth/password';
import {
  validateEmail,
  validateDisplayName,
  validatePassword,
  validateAvatarUrl,
} from '../../../lib/auth/validation';
import {
  findUserByEmail,
  updateUser,
  deleteUser,
  findUserById,
  toSafeUser,
} from '../../../lib/db/users';
import { deleteSessionsForUser } from '../../../lib/db/sessions';
import { deleteUploadedAvatar } from '../../../lib/auth/avatar';
import { logoutUser } from '../../../lib/auth/session';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const GET: APIRoute = async ({ cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);
  return jsonResponse({ user });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);

  const body = await parseJsonBody<{
    email?: string;
    displayName?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const email = body.email ?? user.email;
  const displayName = body.displayName ?? user.displayName;
  let avatarUrl: string | null | undefined = undefined;

  if (body.avatarUrl !== undefined) {
    const trimmed = body.avatarUrl?.trim() ?? '';
    if (trimmed === '') {
      avatarUrl = null;
    } else {
      const urlError = validateAvatarUrl(trimmed);
      if (urlError) return errorResponse(urlError);
      avatarUrl = trimmed;
    }
  }

  const errors = [
    validateEmail(email),
    validateDisplayName(displayName),
    body.newPassword ? validatePassword(body.newPassword) : null,
  ].filter(Boolean);

  if (errors.length > 0) return errorResponse(errors[0]!);

  const existing = findUserById(user.id);
  if (!existing) return errorResponse('User not found.', 404);

  if (body.newPassword) {
    if (!body.currentPassword) {
      return errorResponse('Current password is required to set a new password.');
    }
    if (!(await verifyPassword(body.currentPassword, existing.passwordHash))) {
      logEvent({
        category: EVENT_CATEGORY.PROFILE,
        action: EVENT_ACTION.PROFILE_UPDATE,
        outcome: EVENT_OUTCOME.FAILURE,
        message: `Profile update failed for "${user.username}": incorrect current password.`,
        userId: user.id,
        username: user.username,
        request,
      });
      return errorResponse('Current password is incorrect.', 401);
    }
  }

  const emailTaken = findUserByEmail(email);
  if (emailTaken && emailTaken.id !== user.id) {
    return errorResponse('Email is already in use.', 409);
  }

  if (
    avatarUrl !== undefined &&
    avatarUrl !== existing.avatarUrl &&
    existing.avatarUrl?.startsWith('/uploads/avatars/')
  ) {
    deleteUploadedAvatar(existing.avatarUrl);
  }

  const passwordHash = body.newPassword
    ? await hashPassword(body.newPassword)
    : undefined;

  const updated = updateUser(user.id, {
    email,
    displayName,
    avatarUrl,
    passwordHash,
  });

  if (!updated) return errorResponse('Failed to update profile.', 500);

  logEvent({
    category: EVENT_CATEGORY.PROFILE,
    action: EVENT_ACTION.PROFILE_UPDATE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Profile updated for "${user.username}".`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      emailChanged: email !== user.email,
      passwordChanged: Boolean(body.newPassword),
      avatarChanged: avatarUrl !== undefined,
    },
  });

  return jsonResponse({ user: updated });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);

  const body = await parseJsonBody<{ password?: string }>(request);
  const password = body?.password ?? '';

  if (!password) return errorResponse('Password is required to delete your account.');

  const existing = findUserById(user.id);
  if (!existing) return errorResponse('User not found.', 404);

  if (!(await verifyPassword(password, existing.passwordHash))) {
    logEvent({
      category: EVENT_CATEGORY.PROFILE,
      action: EVENT_ACTION.PROFILE_DELETE,
      outcome: EVENT_OUTCOME.FAILURE,
      message: `Account deletion failed for "${user.username}": incorrect password.`,
      userId: user.id,
      username: user.username,
      request,
    });
    return errorResponse('Password is incorrect.', 401);
  }

  if (existing.avatarUrl?.startsWith('/uploads/avatars/')) {
    deleteUploadedAvatar(existing.avatarUrl);
  }

  deleteSessionsForUser(user.id);
  deleteUser(user.id);
  logoutUser(cookies);

  logEvent({
    category: EVENT_CATEGORY.PROFILE,
    action: EVENT_ACTION.PROFILE_DELETE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Account deleted for "${user.username}".`,
    userId: user.id,
    username: user.username,
    request,
  });

  return jsonResponse({ ok: true });
};
