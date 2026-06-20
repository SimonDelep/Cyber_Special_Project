import type { APIRoute } from 'astro';
import { searchProducts, type ProductSort } from '../../lib/db/products';
import { PRODUCT_CATEGORIES } from '../../lib/auth/product-validation';
import { jsonResponse } from '../../lib/api/response';

const SORT_VALUES = new Set<ProductSort>([
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
  'newest',
]);

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const featured = url.searchParams.get('featured');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const sort = url.searchParams.get('sort') as ProductSort | null;

  if (category && !PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
    return jsonResponse({ products: [], categories: PRODUCT_CATEGORIES });
  }

  const minPriceCents = minPrice ? Number.parseInt(minPrice, 10) : undefined;
  const maxPriceCents = maxPrice ? Number.parseInt(maxPrice, 10) : undefined;

  const products = searchProducts({
    q,
    category: category || undefined,
    featured: featured === 'true' ? true : undefined,
    minPriceCents: Number.isInteger(minPriceCents) ? minPriceCents : undefined,
    maxPriceCents: Number.isInteger(maxPriceCents) ? maxPriceCents : undefined,
    sort: sort && SORT_VALUES.has(sort) ? sort : undefined,
  });

  return jsonResponse({
    products,
    categories: PRODUCT_CATEGORIES,
  });
};
