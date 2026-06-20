import type { APIContext, AstroGlobal } from 'astro';
import type { PublicUser } from '@/lib/auth/types';
import { isAdmin } from '@/lib/auth/rbac';

export function requireAuthPage(astro: AstroGlobal): PublicUser | Response {
  if (!astro.locals.user) {
    const redirect = encodeURIComponent(astro.url.pathname);
    return astro.redirect(`/login?redirect=${redirect}`);
  }
  return astro.locals.user;
}

export function requireGuestPage(astro: AstroGlobal): void | Response {
  if (astro.locals.user) {
    return astro.redirect('/profile');
  }
}

export function requireAuthApi(context: APIContext): PublicUser | Response {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return context.locals.user;
}

export function requireAdminPage(astro: AstroGlobal): PublicUser | Response {
  const user = requireAuthPage(astro);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return astro.redirect('/profile?error=admin_required');
  }
  return user;
}

export function requireAdminApi(context: APIContext): PublicUser | Response {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return new Response(JSON.stringify({ error: 'Administrator access required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
