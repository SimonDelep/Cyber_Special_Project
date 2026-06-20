import type { AstroCookies } from 'astro';
import { resolveUserFromCookies } from '../auth/session';
import { requireAdmin } from '../auth/rbac';
import type { SafeUser } from '../db/schema';
import { errorResponse } from './response';

/** Returns the admin user or an error Response to return from the route. */
export function getAdminFromCookies(
  cookies: AstroCookies,
): SafeUser | Response {
  const user = resolveUserFromCookies(cookies);
  try {
    return requireAdmin(user);
  } catch (res) {
    if (res instanceof Response) {
      const status = res.status;
      return errorResponse(
        status === 403 ? 'Admin access required.' : 'Not authenticated.',
        status,
      );
    }
    throw res;
  }
}
