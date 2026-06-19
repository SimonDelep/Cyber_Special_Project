export const SESSION_COOKIE = 'novanest_session';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PUBLIC_ROUTES = new Set(['/login', '/register']);

export const AUTH_ROUTES = new Set(['/login', '/register']);

export const PROTECTED_ROUTES_PREFIX = ['/profile', '/admin'];
