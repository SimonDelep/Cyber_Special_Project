import type { APIRoute } from 'astro';
import { eq, and, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { products } from '@/db/schema';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { validateProductInput } from '@/lib/admin/validation';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicProduct } from '@/types/product';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

function parseProductId(params: APIRoute['params']): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const productId = parseProductId(params);
  if (!productId) return errorResponse('Invalid product id.', 400);

  const body = await parseJsonBody<{
    slug?: string;
    name?: string;
    description?: string;
    category?: string;
    priceCents?: number;
    imageUrl?: string | null;
    inStock?: boolean;
  }>(request);

  if (!body) return errorResponse('Invalid request body.', 400);

  const errors = validateProductInput({
    slug: body.slug?.trim().toLowerCase(),
    name: body.name,
    description: body.description,
    category: body.category,
    priceCents: body.priceCents,
    imageUrl: body.imageUrl ?? undefined,
    inStock: body.inStock,
  });

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const current = db.select().from(products).where(eq(products.id, productId)).get();
  if (!current) return errorResponse('Product not found.', 404);

  const updates: Partial<typeof products.$inferInsert> = {};

  if (body.slug !== undefined) updates.slug = body.slug.trim().toLowerCase();
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.category !== undefined) updates.category = body.category;
  if (body.priceCents !== undefined) updates.priceCents = body.priceCents;
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl?.trim() || null;
  if (body.inStock !== undefined) updates.inStock = body.inStock;

  if (updates.slug) {
    const taken = db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.slug, updates.slug), ne(products.id, productId)))
      .get();
    if (taken) return errorResponse('Slug already in use.', 409);
  }

  const updated = db
    .update(products)
    .set(updates)
    .where(eq(products.id, productId))
    .returning()
    .get();

  logEvent({
    action: LOG_ACTIONS.ADMIN_PRODUCT_UPDATE,
    category: 'admin',
    status: 'success',
    message: `Admin updated product ${updated.name}`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId, slug: updated.slug },
  });

  return jsonResponse({ product: toPublicProduct(updated) });
};

export const DELETE: APIRoute = ({ params, request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const productId = parseProductId(params);
  if (!productId) return errorResponse('Invalid product id.', 400);

  const db = getDb();
  const current = db.select().from(products).where(eq(products.id, productId)).get();
  if (!current) return errorResponse('Product not found.', 404);

  logEvent({
    action: LOG_ACTIONS.ADMIN_PRODUCT_DELETE,
    category: 'admin',
    status: 'success',
    severity: 'warning',
    message: `Admin deleted product ${current.name}`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId, slug: current.slug },
  });

  db.delete(products).where(eq(products.id, productId)).run();

  return jsonResponse({ ok: true });
};
