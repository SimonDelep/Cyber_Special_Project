import type { APIRoute } from 'astro';
import { createProduct, listAllProducts } from '@/lib/admin/products';
import { requireAdminApi } from '@/lib/auth/guards';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';

export const GET: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const products = await listAllProducts();
  return jsonResponse({ products });
};

export const POST: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const body = await parseJsonBody<{
    categoryId?: string;
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    image?: string;
    badge?: string | null;
    featured?: boolean;
  }>(context.request);
  if (body instanceof Response) return body;

  const { categoryId, name, description, price, image } = body;
  if (!categoryId || !name || !description || price === undefined || !image) {
    return errorResponse(
      'categoryId, name, description, price, and image are required.',
      400,
    );
  }

  try {
    const product = await createProduct({
      categoryId,
      name,
      slug: body.slug,
      description,
      price: Number(price),
      image,
      badge: body.badge,
      featured: body.featured,
    });
    return jsonResponse({ product }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed.';
    return errorResponse(message, 400);
  }
};
