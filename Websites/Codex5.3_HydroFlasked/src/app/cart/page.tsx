import Link from "next/link";
import { CartView } from "@/components/cart/CartView";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function CartPage() {
  const user = await getSessionUser();

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Shopping cart</h1>
            <p className="mt-2 text-slate-400">
              Review your items and complete checkout using your account balance.
            </p>
          </div>
          <Link href="/shop" className="text-sm text-brand-400 hover:text-brand-300">
            ← Continue shopping
          </Link>
        </div>
        <CartView
          products={products}
          balanceCents={user?.balanceCents ?? 0}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
