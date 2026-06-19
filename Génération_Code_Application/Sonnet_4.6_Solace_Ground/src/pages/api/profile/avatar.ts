import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { deleteLocalAvatar, saveAvatarFile } from '@/lib/auth/avatar';
import { errorResponse, jsonResponse } from '@/lib/api';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return errorResponse('Authentication required.', 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Invalid form data.', 400);
  }

  const file = formData.get('avatar');
  if (!file || !(file instanceof File) || file.size === 0) {
    return errorResponse('Choose an image file to upload.', 400);
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

  try {
    const avatarUrl = await saveAvatarFile(locals.user.id, file);
    deleteLocalAvatar(current.avatarUrl);

    const updated = db
      .update(users)
      .set({
        avatarUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, locals.user.id))
      .returning()
      .get();

    logEvent({
      action: LOG_ACTIONS.PROFILE_AVATAR_UPLOAD,
      category: 'profile',
      status: 'success',
      message: `Avatar uploaded for ${updated.username}`,
      userId: updated.id,
      username: updated.username,
      request,
    });

    return jsonResponse({ user: toPublicUser(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return errorResponse(message, 400);
  }
};
