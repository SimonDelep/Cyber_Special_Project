import type { APIRoute } from 'astro';
import { requireAdminApi } from '@/lib/auth/guards';
import { listAllUsers } from '@/lib/auth/user';
import { jsonResponse } from '@/lib/http';

export const GET: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const users = await listAllUsers();
  return jsonResponse({ users });
};
