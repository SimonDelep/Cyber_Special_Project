import type { APIRoute } from 'astro';
import { deleteAvatarFile, saveAvatarFile } from '@/lib/auth/avatar';
import { requireAuthApi } from '@/lib/auth/guards';
import { setUserProfilePicture } from '@/lib/auth/user';
import { errorResponse, jsonResponse } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const formData = await context.request.formData();
  const file = formData.get('avatar');

  if (!(file instanceof File) || file.size === 0) {
    return errorResponse('Please provide an avatar image file.', 400);
  }

  try {
    if (user.profilePicture) {
      await deleteAvatarFile(user.profilePicture);
    }
    const path = await saveAvatarFile(user.id, file);
    const updated = await setUserProfilePicture(user.id, path);
    await logEvent({
      category: 'profile',
      action: EventAction.PROFILE_AVATAR,
      severity: 'info',
      status: 'success',
      message: `Avatar uploaded for ${user.username}.`,
      userId: user.id,
      username: user.username,
      metadata: { fileName: file.name, size: file.size },
      request: context.request,
    });
    return jsonResponse({ user: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    await logEvent({
      category: 'profile',
      action: EventAction.PROFILE_AVATAR,
      severity: 'warning',
      status: 'failure',
      message: `Avatar upload failed for ${user.username}: ${message}`,
      userId: user.id,
      username: user.username,
      request: context.request,
    });
    return errorResponse(message, 400);
  }
};
