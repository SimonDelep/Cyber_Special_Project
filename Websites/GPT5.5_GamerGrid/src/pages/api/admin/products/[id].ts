import type { APIRoute } from 'astro';
import { deleteProduct, updateProduct } from '@/lib/admin/products';
import { requireAdminApi } from '@/lib/auth/guards';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';

export const PATCH: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const { id } = context.params;
  if (!id) return errorResponse('Product id is required.', 400);

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

  try {
    const product = await updateProduct(id, {
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
    });
    return jsonResponse({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.';
    return errorResponse(message, 400);
  }
};

export const DELETE: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const { id } = context.params;
  if (!id) return errorResponse('Product id is required.', 400);

  try {
    await deleteProduct(id);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    return errorResponse(message, 400);
  }
};
