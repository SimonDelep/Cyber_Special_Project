import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCart } from "@/lib/cart/server";
import { prisma } from "@/lib/prisma";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Shopping cart",
};

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/cart");

  const [cart, dbUser] = await Promise.all([
    resolveCart(),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Shopping cart</h1>
      <p className="mt-2 text-muted">
        Review your items and simulate checkout using your account balance.
      </p>
      <div className="mt-10">
        <CartView
          initialCart={cart}
          initialBalance={dbUser ? Number(dbUser.balance) : 0}
        />
      </div>
    </div>
  );
}
