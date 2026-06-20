import type { Product } from "../types/product";
import type { Review } from "../types/review";

const API_BASE = "/api/v1";

export interface CatalogFilters {
  search?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  sort?: "name" | "price_asc" | "price_desc";
}

function buildQuery(params: CatalogFilters): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.category) q.set("category", params.category);
  if (params.min_price) q.set("min_price", params.min_price);
  if (params.max_price) q.set("max_price", params.max_price);
  if (params.sort && params.sort !== "name") q.set("sort", params.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchCatalog(filters: CatalogFilters = {}): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/slug/${slug}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

export async function fetchProductReviews(productId: number): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
  if (!res.ok) throw new Error("Failed to load reviews");
  return res.json();
}

export async function submitReviewJson(
  productId: number,
  payload: { rating: number; comment: string; image_url?: string }
): Promise<Review> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews/json`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to submit review");
  }
  return data;
}

export async function submitReviewWithFile(
  productId: number,
  payload: { rating: number; comment: string; image_url?: string; file?: File }
): Promise<Review> {
  const form = new FormData();
  form.append("rating", String(payload.rating));
  form.append("comment", payload.comment);
  if (payload.image_url?.trim()) form.append("image_url", payload.image_url.trim());
  if (payload.file) form.append("file", payload.file);

  const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to submit review");
  }
  return data;
}

export const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "oral-care", label: "Oral care" },
  { value: "personal-care", label: "Personal care" },
  { value: "household", label: "Household" },
] as const;
