import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../lib/auth/session';
import { listOrdersByUserId } from '../../../lib/db/orders';
import { errorResponse, jsonResponse } from '../../../lib/api/response';

export const GET: APIRoute = async ({ cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);

  const orders = listOrdersByUserId(user.id);
  return jsonResponse({ orders });
};
