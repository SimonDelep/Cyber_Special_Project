import type { APIRoute } from 'astro';
import { getAllCategories, getProductPriceBounds, searchProducts } from '@/lib/products';
import { jsonResponse } from '@/lib/http';

export const GET: APIRoute = async ({ url }) => {
  const search = url.searchParams.get('search') ?? undefined;
  const categorySlug = url.searchParams.get('category') ?? undefined;
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const featuredOnly = url.searchParams.get('featured') === '1';

  const products = await searchProducts({
    search,
    categorySlug: categorySlug || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    featuredOnly,
  });

  const categories = await getAllCategories();
  const priceBounds = await getProductPriceBounds();

  return jsonResponse({ products, categories, priceBounds });
};
