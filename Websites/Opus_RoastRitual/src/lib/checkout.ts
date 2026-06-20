import { db } from "@/lib/db";
import type { CheckoutInput } from "@/lib/validations/checkout";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: "INSUFFICIENT_FUNDS" | "INVALID_CART" | "USER_NOT_FOUND",
    public details?: { balanceCents: number; totalCents: number },
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export async function processCheckout(userId: string, input: CheckoutInput) {
  const productIds = [...new Set(input.items.map((i) => i.productId))];

  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, priceCents: true, name: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const quantityByProduct = new Map<string, number>();
  for (const item of input.items) {
    quantityByProduct.set(
      item.productId,
      (quantityByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const lineItems: { productId: string; quantity: number; priceCents: number }[] =
    [];

  for (const [productId, quantity] of quantityByProduct) {
    const product = productMap.get(productId);
    if (!product) {
      throw new CheckoutError(
        "One or more products are unavailable",
        "INVALID_CART",
      );
    }
    lineItems.push({
      productId: product.id,
      quantity,
      priceCents: product.priceCents,
    });
  }

  const totalCents = lineItems.reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  );

  if (totalCents <= 0) {
    throw new CheckoutError("Cart total is invalid", "INVALID_CART");
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, balanceCents: true },
    });

    if (!user) {
      throw new CheckoutError("Account not found", "USER_NOT_FOUND");
    }

    if (user.balanceCents < totalCents) {
      throw new CheckoutError(
        "Insufficient account balance for this purchase",
        "INSUFFICIENT_FUNDS",
        { balanceCents: user.balanceCents, totalCents },
      );
    }

    const balanceAfter = user.balanceCents - totalCents;

    await tx.user.update({
      where: { id: userId },
      data: { balanceCents: balanceAfter },
    });

    const order = await tx.order.create({
      data: {
        userId,
        totalCents,
        items: {
          create: lineItems.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            priceCents: line.priceCents,
          })),
        },
      },
      select: { id: true, totalCents: true, createdAt: true },
    });

    return {
      order,
      balanceCents: balanceAfter,
      totalCents,
    };
  });
}
