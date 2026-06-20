import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const user = await getCurrentUser();

  return <CartView user={user} />;
}
