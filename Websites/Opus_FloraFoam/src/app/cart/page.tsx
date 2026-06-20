import { redirect } from "next/navigation";
import { CartCheckout } from "@/components/cart/CartCheckout";
import { auth } from "@/auth";
import { computeCartTotalCents, getCartWithItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/types/product";

export const metadata = {
  title: "Cart | FloraFoam",
};

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cart");
  }

  const [cart, user] = await Promise.all([
    getCartWithItems(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balanceCents: true },
    }),
  ]);

  const items = cart?.items ?? [];
  const totalCents = computeCartTotalCents(items);
  const balanceCents = user?.balanceCents ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-sage-900">Shopping cart</h1>
        <p className="mt-2 text-sage-600">
          Review your items and complete a simulated checkout using your account balance (
          {formatPrice(balanceCents)} available).
        </p>
      </div>

      <CartCheckout
        items={items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            category: item.product.category,
            priceCents: item.product.priceCents,
            imageUrl: item.product.imageUrl,
            inStock: item.product.inStock,
          },
        }))}
        balanceCents={balanceCents}
        totalCents={totalCents}
      />
    </div>
  );
}
