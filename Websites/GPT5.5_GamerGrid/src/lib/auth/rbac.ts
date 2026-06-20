import type { UserRole } from '@/db/schema';
import type { PublicUser } from '@/lib/auth/types';

export function isAdmin(user: PublicUser | null | undefined): user is PublicUser {
  return user?.role === 'admin';
}

export function isUser(user: PublicUser | null | undefined): user is PublicUser {
  return user?.role === 'user';
}

export function hasRole(
  user: PublicUser | null | undefined,
  role: UserRole,
): boolean {
  return user?.role === role;
}
