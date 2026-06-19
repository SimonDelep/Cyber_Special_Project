import type { APIRoute } from "astro";
import { getAllProducts } from "@/db/queries";

export const GET: APIRoute = async () => {
  try {
    const products = getAllProducts();
    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database unavailable";
    return new Response(JSON.stringify({ error: message, products: [] }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
