import type { APIRoute } from 'astro';
import { deleteAvatarFile } from '@/lib/auth/avatar';
import { requireAuthApi } from '@/lib/auth/guards';
import { destroySession } from '@/lib/auth/session';
import {
  deleteUserAccount,
  findUserById,
  updateUserProfile,
} from '@/lib/auth/user';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const GET: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;
  return jsonResponse({ user });
};

export const PATCH: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const body = await parseJsonBody<{
    displayName?: string;
    email?: string;
    bio?: string;
    profilePicture?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }>(context.request);

  if (body instanceof Response) return body;

  try {
    const updated = await updateUserProfile(user.id, body);
    const fieldsChanged = [
      body.displayName !== undefined && 'displayName',
      body.email !== undefined && 'email',
      body.bio !== undefined && 'bio',
      body.profilePicture !== undefined && 'profilePicture',
      body.newPassword && 'password',
    ].filter(Boolean);

    await logEvent({
      category: 'profile',
      action: EventAction.PROFILE_UPDATE,
      severity: 'info',
      status: 'success',
      message: `Profile updated for ${user.username}.`,
      userId: user.id,
      username: user.username,
      metadata: { fieldsChanged },
      request: context.request,
    });
    return jsonResponse({ user: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.';
    await logEvent({
      category: 'profile',
      action: EventAction.PROFILE_UPDATE,
      severity: 'warning',
      status: 'failure',
      message: `Profile update failed for ${user.username}: ${message}`,
      userId: user.id,
      username: user.username,
      request: context.request,
    });
    return errorResponse(message, 400);
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const body = await parseJsonBody<{ password?: string }>(context.request);
  if (body instanceof Response) return body;

  if (!body.password) {
    return errorResponse('Password is required to delete your account.', 400);
  }

  const row = await findUserById(user.id);
  if (!row) return errorResponse('User not found.', 404);

  const { verifyPassword } = await import('@/lib/auth/password');
  const valid = await verifyPassword(body.password, row.passwordHash);
  if (!valid) {
    return errorResponse('Incorrect password.', 401);
  }

  await deleteAvatarFile(user.profilePicture);
  await deleteUserAccount(user.id);
  await destroySession(context.cookies);

  await logEvent({
    category: 'profile',
    action: EventAction.PROFILE_DELETE,
    severity: 'warning',
    status: 'success',
    message: `Account deleted: ${user.username}.`,
    userId: user.id,
    username: user.username,
    request: context.request,
  });

  return jsonResponse({ ok: true });
};
