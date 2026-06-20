import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../lib/api/admin-guard';
import { listUsers } from '../../../lib/db/users';
import { jsonResponse } from '../../../lib/api/response';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;
  return jsonResponse({ users: listUsers() });
};
