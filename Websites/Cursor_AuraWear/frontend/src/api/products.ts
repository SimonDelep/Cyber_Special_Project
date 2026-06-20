import { apiRequest } from "./client";
import type { Product, ProductFilters } from "../types/product";

function buildQuery(filters?: ProductFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.min_price) params.set("min_price", filters.min_price);
  if (filters.max_price) params.set("max_price", filters.max_price);
  if (filters.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchProducts(filters?: ProductFilters) {
  return apiRequest<Product[]>(`/products${buildQuery(filters)}`);
}

export function fetchProductCategories() {
  return apiRequest<string[]>("/products/categories");
}

export function fetchProduct(productId: number) {
  return apiRequest<Product>(`/products/${productId}`);
}
