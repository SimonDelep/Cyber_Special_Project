import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1),
});
