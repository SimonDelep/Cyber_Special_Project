import { cookies } from "next/headers";
import type { CartLine } from "@/lib/cart/types";
import { CART_COOKIE } from "@/lib/cart/constants";
import { parseCartJson } from "@/lib/cart/store";

export async function getCartLines(): Promise<CartLine[]> {
  const cookieStore = await cookies();
  return parseCartJson(cookieStore.get(CART_COOKIE)?.value);
}

export async function getCartItemCount(): Promise<number> {
  const lines = await getCartLines();
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
