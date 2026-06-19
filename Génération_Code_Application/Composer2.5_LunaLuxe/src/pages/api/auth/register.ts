import type { APIRoute } from 'astro';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/auth/password';
import { createUser, findUserByEmail, findUserByUsername } from '@/lib/auth/users';
import { buildSessionCookie, createSession } from '@/lib/auth/session';
import { isSecureRequest, redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const username = String(form.get('username') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const displayName = String(form.get('displayName') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const confirmPassword = String(form.get('confirmPassword') ?? '');
  const redirect = String(form.get('redirect') ?? '/profile');

  const errors: string[] = [];
  const usernameErr = validateUsername(username);
  if (usernameErr) errors.push(usernameErr);
  const emailErr = validateEmail(email);
  if (emailErr) errors.push(emailErr);
  const passwordErr = validatePassword(password);
  if (passwordErr) errors.push(passwordErr);
  if (password !== confirmPassword) errors.push('Passwords do not match.');
  if (!displayName || displayName.length > 64) {
    errors.push('Display name is required (max 64 characters).');
  }

  if (errors.length > 0) {
    return redirectResponse(`/register?error=${encodeURIComponent(errors[0])}`);
  }

  if (await findUserByUsername(username)) {
    return redirectResponse('/register?error=Username+is+already+taken');
  }
  if (await findUserByEmail(email)) {
    return redirectResponse('/register?error=Email+is+already+registered');
  }

  const user = await createUser({ username, email, password, displayName });
  const token = await createSession(user.id);
  const secure = isSecureRequest(request);

  const safeRedirect = redirect.startsWith('/') ? redirect : '/profile';

  await logEvent({
    eventType: EventType.AUTH_REGISTER,
    severity: 'success',
    message: `New account registered: "${username}"`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { email },
  });

  return redirectResponse(safeRedirect, [buildSessionCookie(token, secure)]);
};
