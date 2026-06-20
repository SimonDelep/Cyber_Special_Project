import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../../lib/api/admin-guard';
import {
  validateProductCategory,
  validateProductDescription,
  validateProductImage,
  validateProductName,
  validateProductSlug,
  validatePriceCents,
} from '../../../../lib/auth/product-validation';
import {
  deleteProduct,
  findProductBySlug,
  getProductById,
  updateProduct,
} from '../../../../lib/db/products';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../../lib/api/response';
import { logEvent } from '../../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../../lib/events/constants';

function parseProductId(params: { id?: string }): number | null {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const productId = parseProductId(params);
  if (!productId) return errorResponse('Invalid product id.');

  const existing = getProductById(productId);
  if (!existing) return errorResponse('Product not found.', 404);

  const body = await parseJsonBody<{
    name?: string;
    slug?: string;
    description?: string;
    priceCents?: number;
    category?: string;
    image?: string;
    featured?: boolean;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const name = body.name ?? existing.name;
  const slug = (body.slug ?? existing.slug).trim().toLowerCase();
  const description = body.description ?? existing.description;
  const priceCents = body.priceCents ?? existing.priceCents;
  const category = body.category ?? existing.category;
  const image = body.image ?? existing.image;
  const featured = body.featured !== undefined ? Boolean(body.featured) : existing.featured;

  const errors = [
    validateProductName(name),
    validateProductSlug(slug),
    validateProductDescription(description),
    validatePriceCents(priceCents),
    validateProductCategory(category),
    validateProductImage(image),
  ].filter(Boolean);

  if (errors.length > 0) return errorResponse(errors[0]!);

  const slugTaken = findProductBySlug(slug);
  if (slugTaken && slugTaken.id !== productId) {
    return errorResponse('A product with this slug already exists.', 409);
  }

  const product = updateProduct(productId, {
    name,
    slug,
    description,
    priceCents,
    category,
    image,
    featured,
  });

  if (!product) return errorResponse('Failed to update product.', 500);
  return jsonResponse({ product });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const productId = parseProductId(params);
  if (!productId) return errorResponse('Invalid product id.');

  const existing = getProductById(productId);
  if (!existing) {
    return errorResponse('Product not found.', 404);
  }

  deleteProduct(productId);

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_PRODUCT_DELETE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" deleted product "${existing.name}" (id ${productId}).`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId, slug: existing.slug },
  });

  return jsonResponse({ ok: true });
};
