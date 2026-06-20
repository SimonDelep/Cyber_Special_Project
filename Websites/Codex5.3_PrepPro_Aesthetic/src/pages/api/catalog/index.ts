import type { APIRoute } from "astro";
import { searchProducts, type CatalogFilters } from "@/db/catalog";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/products/validate";
import { jsonResponse } from "@/lib/api/response";

function parseBoolParam(value: string | null): boolean | "" {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return "";
}

export const GET: APIRoute = ({ url }) => {
  const params = url.searchParams;
  const category = params.get("category") ?? "";
  const filters: CatalogFilters = {
    q: params.get("q") ?? undefined,
    category: PRODUCT_CATEGORIES.includes(category as ProductCategory)
      ? (category as ProductCategory)
      : "",
    featured: parseBoolParam(params.get("featured")),
    stackable: parseBoolParam(params.get("stackable")),
    leakProof: parseBoolParam(params.get("leakProof")),
    minPriceCents: params.get("minPrice")
      ? Math.round(Number.parseFloat(params.get("minPrice")!) * 100)
      : undefined,
    maxPriceCents: params.get("maxPrice")
      ? Math.round(Number.parseFloat(params.get("maxPrice")!) * 100)
      : undefined,
    sort: (params.get("sort") as CatalogFilters["sort"]) ?? "newest",
  };

  const products = searchProducts(filters);
  return jsonResponse({ products, count: products.length, filters });
};
