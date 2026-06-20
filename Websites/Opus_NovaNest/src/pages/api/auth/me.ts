import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../lib/auth/session';
import { errorResponse, jsonResponse } from '../../../lib/api/response';

export const GET: APIRoute = async ({ cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);
  return jsonResponse({ user });
};
