import type { SafeUser } from '../db/schema';
import { ROLES } from './constants';

export function isAdmin(user: SafeUser | null | undefined): boolean {
  return user?.role === ROLES.ADMIN;
}

export function isAuthenticated(user: SafeUser | null | undefined): boolean {
  return user != null;
}

export function requireAuth(user: SafeUser | null): SafeUser {
  if (!user) throw new Response('Unauthorized', { status: 401 });
  return user;
}

export function requireAdmin(user: SafeUser | null): SafeUser {
  const authed = requireAuth(user);
  if (!isAdmin(authed)) throw new Response('Forbidden', { status: 403 });
  return authed;
}
