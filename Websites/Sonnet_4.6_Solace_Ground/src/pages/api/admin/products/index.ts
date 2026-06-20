import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { products } from '@/db/schema';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { validateProductInput } from '@/lib/admin/validation';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { toPublicProduct } from '@/types/product';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const db = getDb();
  const all = db.select().from(products).all();

  return jsonResponse({ products: all.map(toPublicProduct) });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const body = await parseJsonBody<{
    slug?: string;
    name?: string;
    description?: string;
    category?: string;
    priceCents?: number;
    imageUrl?: string | null;
    inStock?: boolean;
  }>(request);

  if (!body?.slug || !body?.name || !body?.description || !body?.category) {
    return errorResponse('slug, name, description, and category are required.', 400);
  }

  if (body.priceCents === undefined) {
    return errorResponse('priceCents is required.', 400);
  }

  const slug = body.slug.trim().toLowerCase();
  const errors = validateProductInput({
    slug,
    name: body.name,
    description: body.description,
    category: body.category,
    priceCents: body.priceCents,
    imageUrl: body.imageUrl ?? null,
    inStock: body.inStock ?? true,
  });

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const existing = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .get();

  if (existing) {
    return errorResponse('A product with this slug already exists.', 409);
  }

  const inserted = db
    .insert(products)
    .values({
      slug,
      name: body.name.trim(),
      description: body.description.trim(),
      category: body.category,
      priceCents: body.priceCents,
      imageUrl: body.imageUrl?.trim() || null,
      inStock: body.inStock ?? true,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  logEvent({
    action: LOG_ACTIONS.ADMIN_PRODUCT_CREATE,
    category: 'admin',
    status: 'success',
    message: `Admin created product ${inserted.name}`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId: inserted.id, slug: inserted.slug },
  });

  return jsonResponse({ product: toPublicProduct(inserted) }, 201);
};
