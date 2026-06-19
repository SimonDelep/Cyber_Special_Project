import { defineMiddleware } from 'astro:middleware';
import { getTokenFromCookie, getSessionUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/rbac';

const protectedRoutes = ['/profile', '/checkout'];
const adminRoutes = ['/admin'];
const guestOnlyRoutes = ['/login', '/register'];

function normalizePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path;
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

  try {
    const token = getTokenFromCookie(context.request.headers.get('cookie'));
    if (token) {
      context.locals.user = await getSessionUser(token);
    }
  } catch {
    context.locals.user = null;
  }

  const pathname = normalizePath(context.url.pathname);

  if (protectedRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`)) && !context.locals.user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (adminRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    if (!context.locals.user) {
      return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (!canAccessAdmin(context.locals.user.role)) {
      return context.redirect('/profile?error=unauthorized');
    }
  }

  if (guestOnlyRoutes.includes(pathname) && context.locals.user) {
    return context.redirect('/profile');
  }

  return next();
});
