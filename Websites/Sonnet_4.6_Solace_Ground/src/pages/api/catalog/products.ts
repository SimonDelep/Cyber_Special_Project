import type { APIRoute } from 'astro';
import { queryCatalog } from '@/lib/catalog/query';
import { jsonResponse } from '@/lib/api';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const params = url.searchParams;
  const q = params.get('q') ?? undefined;
  const category = params.get('category') ?? undefined;
  const inStock = params.get('inStock') === 'true' ? true : undefined;
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  const minRating = params.get('minRating');

  const products = queryCatalog({
    q,
    category,
    inStock,
    minPriceCents:
      minPrice && !Number.isNaN(parseFloat(minPrice))
        ? Math.round(parseFloat(minPrice) * 100)
        : undefined,
    maxPriceCents:
      maxPrice && !Number.isNaN(parseFloat(maxPrice))
        ? Math.round(parseFloat(maxPrice) * 100)
        : undefined,
    minRating:
      minRating && !Number.isNaN(parseFloat(minRating))
        ? parseFloat(minRating)
        : undefined,
  });

  return jsonResponse({ products });
};
