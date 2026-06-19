import type { APIRoute } from 'astro';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { jsonResponse } from '@/lib/api';
import { toPublicUser } from '@/types/auth';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const db = getDb();
  const all = db.select().from(users).all();

  return jsonResponse({
    users: all.map((u) => toPublicUser(u)),
  });
};
