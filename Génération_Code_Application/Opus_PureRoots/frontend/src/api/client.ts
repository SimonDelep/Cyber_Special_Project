import type { Product } from "../types/product";

const API_BASE = "/api/v1";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    throw new Error("Failed to load products");
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error("API unavailable");
  }
  return res.json();
}
