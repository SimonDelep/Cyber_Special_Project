import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartView } from "@/components/cart/CartView";
import { getCartForUser, getUserBalanceCents } from "@/lib/cart/server";
import { getSession } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/cart");
  }

  const [cart, balanceCents] = await Promise.all([
    getCartForUser(session.user.id),
    getUserBalanceCents(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-4xl text-sand-900">Shopping cart</h1>
      <p className="mt-2 text-sm text-sand-600">
        Signed in as @{session.user.username} · Balance:{" "}
        {formatPrice(balanceCents)}
      </p>
      <div className="mt-10">
        <CartView initialCart={cart} initialBalanceCents={balanceCents} />
      </div>
    </div>
  );
}
