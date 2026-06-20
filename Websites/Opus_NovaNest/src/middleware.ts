import { defineMiddleware } from 'astro:middleware';
import { resolveUserFromCookies } from './lib/auth/session';
import { AUTH_ROUTES, PROTECTED_ROUTES_PREFIX } from './lib/auth/constants';
import { ROLES } from './lib/auth/constants';
import { purgeExpiredSessions } from './lib/db/sessions';

export const onRequest = defineMiddleware(async (context, next) => {
  purgeExpiredSessions();

  const user = resolveUserFromCookies(context.cookies);
  context.locals.user = user;

  const pathname = context.url.pathname;

  if (user && AUTH_ROUTES.has(pathname)) {
    return context.redirect('/profile');
  }

  const isProtected = PROTECTED_ROUTES_PREFIX.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected) {
    if (!user) {
      const redirectTo = encodeURIComponent(pathname);
      return context.redirect(`/login?redirect=${redirectTo}`);
    }
    if (pathname.startsWith('/admin') && user.role !== ROLES.ADMIN) {
      return context.redirect('/profile?error=forbidden');
    }
  }

  return next();
});
