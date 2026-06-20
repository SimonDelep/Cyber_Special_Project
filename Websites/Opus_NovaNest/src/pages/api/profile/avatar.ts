import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../lib/auth/session';
import { findUserById, updateUser } from '../../../lib/db/users';
import { saveAvatarFile, deleteUploadedAvatar } from '../../../lib/auth/avatar';
import { errorResponse, jsonResponse } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Expected multipart form data.');
  }

  const file = formData.get('avatar');
  if (!file || !(file instanceof File)) {
    return errorResponse('No avatar file provided.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let publicPath: string;
  try {
    ({ publicPath } = saveAvatarFile(buffer, file.type || 'application/octet-stream'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return errorResponse(message);
  }

  const existing = findUserById(user.id);
  if (existing?.avatarUrl?.startsWith('/uploads/avatars/')) {
    deleteUploadedAvatar(existing.avatarUrl);
  }

  const updated = updateUser(user.id, { avatarUrl: publicPath });
  if (!updated) return errorResponse('Failed to update avatar.', 500);

  logEvent({
    category: EVENT_CATEGORY.PROFILE,
    action: EVENT_ACTION.PROFILE_AVATAR,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Avatar uploaded for "${user.username}".`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { avatarUrl: publicPath },
  });

  return jsonResponse({ user: updated });
};
