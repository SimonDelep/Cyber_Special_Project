import type { APIRoute } from 'astro';
import { getAllProducts } from '@/lib/products';

export const GET: APIRoute = async () => {
  try {
    const products = await getAllProducts();
    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Database not ready. Run npm run db:seed first.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
