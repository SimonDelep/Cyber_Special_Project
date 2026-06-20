import type { APIContext } from 'astro';
import { canAccessAdmin } from '@/lib/auth/rbac';
import { redirectResponse } from '@/lib/auth/response';
import type { SessionUser } from '@/lib/auth/session';

export function requireAdmin(context: APIContext): SessionUser | Response {
  const user = context.locals.user ?? null;
  if (!user) {
    return redirectResponse('/login?redirect=/admin');
  }
  if (!canAccessAdmin(user.role)) {
    return redirectResponse('/profile?error=unauthorized');
  }
  return user;
}
