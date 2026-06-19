import type { APIContext } from 'astro';
import { isAdmin } from '@/lib/auth/rbac';
import { errorResponse } from '@/lib/api';
import type { PublicUser } from '@/types/auth';

export function requireAdminApi(
  locals: APIContext['locals'],
): PublicUser | Response {
  if (!locals.user || !isAdmin(locals.user)) {
    return errorResponse('Administrator access required.', 403);
  }
  return locals.user;
}

export function isAdminResponse(result: PublicUser | Response): result is Response {
  return result instanceof Response;
}
