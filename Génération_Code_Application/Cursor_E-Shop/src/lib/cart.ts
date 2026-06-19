import { isPrismaUnavailable } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { dollarsToCents } from "@/lib/money";

function isCartQueryFailure(err: unknown): boolean {
  return isPrismaUnavailable(err);
}

export async function getCartItems(userId: string) {
  try {
    return await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    if (isCartQueryFailure(err)) {
      return [];
    }
    throw err;
  }
}

export async function getCartItemCount(userId: string) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      select: { quantity: true },
    });
    return items.reduce((sum, item) => sum + item.quantity, 0);
  } catch (err) {
    if (isCartQueryFailure(err)) {
      return 0;
    }
    throw err;
  }
}

export function lineTotalCents(price: { toString(): string }, quantity: number) {
  return dollarsToCents(Number(price.toString())) * quantity;
}

export async function getCartSummary(userId: string) {
  const items = await getCartItems(userId);
  const totalCents = items.reduce(
    (sum, item) => sum + lineTotalCents(item.product.price, item.quantity),
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, totalCents, itemCount };
}
