import type { APIRoute } from 'astro';
import { requireAuthApi } from '@/lib/auth/guards';
import { jsonResponse } from '@/lib/http';

export const GET: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;
  return jsonResponse({ user });
};
