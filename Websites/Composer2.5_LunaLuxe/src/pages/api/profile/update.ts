import type { APIRoute } from 'astro';
import { verifyPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import {
  deleteLocalAvatar,
  saveAvatarFile,
  validateAvatarUrl,
} from '@/lib/auth/avatar';
import {
  deleteUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from '@/lib/auth/users';
import {
  buildClearSessionCookie,
  destroyAllUserSessions,
} from '@/lib/auth/session';
import { isSecureRequest, redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user ?? null;
  if (!user) {
    return redirectResponse('/login?redirect=/profile');
  }

  const form = await request.formData();
  const action = String(form.get('_action') ?? 'update');

  if (action === 'delete') {
    const confirm = String(form.get('confirmUsername') ?? '');
    if (confirm !== user.username) {
      return redirectResponse('/profile?error=Type+your+username+to+confirm+deletion');
    }
    const fullUser = await findUserById(user.id);
    if (fullUser?.avatarUrl) deleteLocalAvatar(fullUser.avatarUrl);
    await destroyAllUserSessions(user.id);
    await deleteUser(user.id);

    await logEvent({
      eventType: EventType.PROFILE_DELETE,
      severity: 'warning',
      message: `User "${user.username}" deleted their own account`,
      userId: user.id,
      username: user.username,
      request,
    });

    return redirectResponse('/', [buildClearSessionCookie(isSecureRequest(request))]);
  }

  const displayName = String(form.get('displayName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const bio = String(form.get('bio') ?? '').trim();
  const avatarUrlInput = String(form.get('avatarUrl') ?? '').trim();
  const newPassword = String(form.get('newPassword') ?? '');
  const currentPassword = String(form.get('currentPassword') ?? '');
  const avatarFile = form.get('avatarFile');

  if (!displayName || displayName.length > 64) {
    return redirectResponse('/profile?error=Display+name+is+required');
  }

  const emailErr = validateEmail(email);
  if (emailErr) return redirectResponse(`/profile?error=${encodeURIComponent(emailErr)}`);

  const existingEmail = await findUserByEmail(email);
  if (existingEmail && existingEmail.id !== user.id) {
    return redirectResponse('/profile?error=Email+is+already+in+use');
  }

  let avatarUrl: string | null | undefined = undefined;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const fullUser = await findUserById(user.id);
      if (fullUser?.avatarUrl) deleteLocalAvatar(fullUser.avatarUrl);
      avatarUrl = await saveAvatarFile(user.id, avatarFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload avatar';
      return redirectResponse(`/profile?error=${encodeURIComponent(msg)}`);
    }
  } else if (avatarUrlInput) {
    const urlErr = validateAvatarUrl(avatarUrlInput);
    if (urlErr) return redirectResponse(`/profile?error=${encodeURIComponent(urlErr)}`);
    avatarUrl = avatarUrlInput;
  } else if (form.has('clearAvatar')) {
    const fullUser = await findUserById(user.id);
    if (fullUser?.avatarUrl) deleteLocalAvatar(fullUser.avatarUrl);
    avatarUrl = null;
  }

  if (newPassword) {
    const passwordErr = validatePassword(newPassword);
    if (passwordErr) return redirectResponse(`/profile?error=${encodeURIComponent(passwordErr)}`);

    const fullUser = await findUserById(user.id);
    if (!fullUser) return redirectResponse('/login');

    if (!currentPassword || !(await verifyPassword(currentPassword, fullUser.passwordHash))) {
      return redirectResponse('/profile?error=Current+password+is+incorrect');
    }
    await updateUserPassword(user.id, newPassword);
  }

  await updateUserProfile(user.id, { displayName, email, bio, avatarUrl });

  await logEvent({
    eventType: EventType.PROFILE_UPDATE,
    severity: 'info',
    message: `User "${user.username}" updated their profile`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      passwordChanged: Boolean(newPassword),
      avatarChanged: avatarUrl !== undefined,
    },
  });

  return redirectResponse('/profile?success=Profile+updated');
};
