import type { APIRoute } from 'astro';
import {
  getAllProducts,
  getProductsByCategory,
  getFeaturedProducts,
} from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');

  const rows = category
    ? getProductsByCategory(category)
    : featured === 'true'
      ? getFeaturedProducts()
      : getAllProducts();

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
