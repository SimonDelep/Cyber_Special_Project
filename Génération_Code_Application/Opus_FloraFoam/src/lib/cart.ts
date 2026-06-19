import { prisma } from "@/lib/prisma";

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getCartItemCount(userId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: { select: { quantity: true } },
    },
  });

  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function getCartWithItems(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
    },
  });

  return cart;
}

export function computeCartTotalCents(
  items: { quantity: number; product: { priceCents: number } }[],
): number {
  return items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}
