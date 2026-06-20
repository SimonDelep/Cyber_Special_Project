import { apiFetch } from "./client";
import type { Product } from "../types/product";
import type { SortOption } from "../types/catalog";

export interface ProductQueryParams {
  search?: string;
  category?: string;
  min_price_cents?: number;
  max_price_cents?: number;
  sort?: SortOption;
}

export async function fetchProducts(params: ProductQueryParams = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category) qs.set("category", params.category);
  if (params.min_price_cents !== undefined) qs.set("min_price_cents", String(params.min_price_cents));
  if (params.max_price_cents !== undefined) qs.set("max_price_cents", String(params.max_price_cents));
  if (params.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return apiFetch<Product[]>(`/api/products${query ? `?${query}` : ""}`);
}

export async function fetchProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    keyboard: "Keyboards",
    mouse: "Mice",
    desk_mat: "Desk Mats",
  };
  return labels[category] ?? category;
}
