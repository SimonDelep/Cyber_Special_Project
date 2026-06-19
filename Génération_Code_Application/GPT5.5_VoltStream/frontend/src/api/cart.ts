import { apiFetch } from "./client";
import type { Product } from "../types/product";

export interface CartItem {
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  total_cents: number;
  item_count: number;
}

export async function fetchCart(): Promise<Cart> {
  return apiFetch<Cart>("/api/cart");
}

export async function addCartItem(productId: number, quantity = 1): Promise<CartItem> {
  return apiFetch<CartItem>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function updateCartItem(productId: number, quantity: number): Promise<CartItem> {
  return apiFetch<CartItem>(`/api/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId: number): Promise<void> {
  return apiFetch<void>(`/api/cart/items/${productId}`, { method: "DELETE" });
}

export async function mergeGuestCart(
  items: { product_id: number; quantity: number }[]
): Promise<Cart> {
  return apiFetch<Cart>("/api/cart/merge", {
    method: "POST",
    body: JSON.stringify(items),
  });
}
