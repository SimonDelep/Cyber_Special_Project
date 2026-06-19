"use server";

import { redirect } from "next/navigation";
import { addToCart } from "@/lib/cart";

export async function addToCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const quantityRaw = Number(formData.get("quantity") ?? 1);

  if (!productId) {
    redirect(`/products/${slug}`);
  }

  const quantity = Number.isFinite(quantityRaw) ? quantityRaw : 1;
  addToCart(productId, quantity);

  redirect("/cart");
}

