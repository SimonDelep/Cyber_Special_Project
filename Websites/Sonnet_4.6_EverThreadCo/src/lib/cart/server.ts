import { prisma } from "@/lib/prisma";
import { buildCartSummary, type CartSummary } from "@/lib/cart/types";

const cartItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      priceCents: true,
      imageUrl: true,
      inStock: true,
    },
  },
} as const;

export async function getCartForUser(userId: string): Promise<CartSummary> {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: cartItemInclude,
    orderBy: { createdAt: "asc" },
  });

  return buildCartSummary(rows);
}

export async function getUserBalanceCents(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceCents: true },
  });
  return user?.balanceCents ?? 0;
}
