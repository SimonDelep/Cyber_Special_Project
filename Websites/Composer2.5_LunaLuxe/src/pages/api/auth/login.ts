import type { APIRoute } from 'astro';
import { verifyPassword } from '@/lib/auth/password';
import { findUserByUsername } from '@/lib/auth/users';
import { buildSessionCookie, createSession } from '@/lib/auth/session';
import { isSecureRequest, redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const redirect = String(form.get('redirect') ?? '/profile');

  if (!username || !password) {
    await logEvent({
      eventType: EventType.AUTH_LOGIN_FAILED,
      severity: 'warning',
      message: 'Login attempt with missing credentials',
      username: username || null,
      request,
      metadata: { reason: 'missing_fields' },
    });
    return redirectResponse('/login?error=Username+and+password+are+required');
  }

  const user = await findUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await logEvent({
      eventType: EventType.AUTH_LOGIN_FAILED,
      severity: 'warning',
      message: `Failed login attempt for username "${username}"`,
      username,
      request,
      metadata: { reason: 'invalid_credentials' },
    });
    return redirectResponse('/login?error=Invalid+username+or+password');
  }

  const token = await createSession(user.id);
  const secure = isSecureRequest(request);
  const safeRedirect = redirect.startsWith('/') ? redirect : '/profile';

  await logEvent({
    eventType: EventType.AUTH_LOGIN_SUCCESS,
    severity: 'success',
    message: `User "${user.username}" logged in successfully`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { redirect: safeRedirect },
  });

  return redirectResponse(safeRedirect, [buildSessionCookie(token, secure)]);
};
