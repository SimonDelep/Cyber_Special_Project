import type { APIRoute } from 'astro';
import { listCategories } from '@/lib/admin/products';
import { requireAdminApi } from '@/lib/auth/guards';
import { jsonResponse } from '@/lib/http';

export const GET: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const categories = await listCategories();
  return jsonResponse({ categories });
};
