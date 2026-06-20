import type { UserRole } from '@/db/schema';
import type { PublicUser } from '@/types/auth';

export function isAdmin(user: PublicUser | null | undefined): boolean {
  return user?.role === 'admin';
}

export function hasRole(
  user: PublicUser | null | undefined,
  role: UserRole,
): boolean {
  return user?.role === role;
}

export function requireUser(user: PublicUser | null | undefined): PublicUser {
  if (!user) {
    throw new AuthError('Authentication required.', 401);
  }
  return user;
}

export function requireAdmin(user: PublicUser | null | undefined): PublicUser {
  const u = requireUser(user);
  if (!isAdmin(u)) {
    throw new AuthError('Administrator access required.', 403);
  }
  return u;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
