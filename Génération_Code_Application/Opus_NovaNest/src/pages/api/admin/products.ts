import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../lib/api/admin-guard';
import {
  validateProductCategory,
  validateProductDescription,
  validateProductImage,
  validateProductName,
  validateProductSlug,
  validatePriceCents,
} from '../../../lib/auth/product-validation';
import {
  createProduct,
  findProductBySlug,
  getAllProducts,
} from '../../../lib/db/products';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;
  return jsonResponse({ products: getAllProducts() });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

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

  const name = body.name ?? '';
  const slug = (body.slug ?? '').trim().toLowerCase();
  const description = body.description ?? '';
  const priceCents = body.priceCents ?? -1;
  const category = body.category ?? '';
  const image = body.image ?? '';
  const featured = Boolean(body.featured);

  const errors = [
    validateProductName(name),
    validateProductSlug(slug),
    validateProductDescription(description),
    validatePriceCents(priceCents),
    validateProductCategory(category),
    validateProductImage(image),
  ].filter(Boolean);

  if (errors.length > 0) return errorResponse(errors[0]!);

  if (findProductBySlug(slug)) {
    return errorResponse('A product with this slug already exists.', 409);
  }

  const product = createProduct({
    name,
    slug,
    description,
    priceCents,
    category,
    image,
    featured,
  });

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_PRODUCT_CREATE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" created product "${product.name}".`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId: product.id, slug: product.slug },
  });

  return jsonResponse({ product }, 201);
};
