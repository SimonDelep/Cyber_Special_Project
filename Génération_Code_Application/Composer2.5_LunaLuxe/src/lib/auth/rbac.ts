import type { UserRole } from '@/db/schema';

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isUser(role: UserRole): boolean {
  return role === 'user';
}

export function canAccessAdmin(role: UserRole): boolean {
  return isAdmin(role);
}
