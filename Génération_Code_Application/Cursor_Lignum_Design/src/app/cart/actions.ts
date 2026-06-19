"use server";

import { redirect } from "next/navigation";
import { clearCart, getCart, removeFromCart, updateCartItem } from "@/lib/cart";

export async function updateCartItemAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantityRaw = Number(formData.get("quantity") ?? 1);
  if (!productId) redirect("/cart");

  const quantity = Number.isFinite(quantityRaw) ? quantityRaw : 1;
  updateCartItem(productId, quantity);
  redirect("/cart");
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) redirect("/cart");
  removeFromCart(productId);
  redirect("/cart");
}

export async function clearCartAction(): Promise<void> {
  const cart = getCart();
  if (!cart.length) {
    redirect("/cart");
  }
  clearCart();
  redirect("/cart");
}

