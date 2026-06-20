import { prisma } from "@/lib/prisma";
import { getCartLines } from "@/lib/cart/cookie";
import type { CartLine, ResolvedCart } from "@/lib/cart/types";

export async function resolveCartFromLines(
  lines: CartLine[],
): Promise<ResolvedCart> {
  if (lines.length === 0) {
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  const productIds = lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const items: ResolvedCart["items"] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) continue;
    const price = Number(product.price);
    items.push({
      productId: product.id,
      quantity: line.quantity,
      name: product.name,
      slug: product.slug,
      price,
      inStock: product.inStock,
      lineTotal: price * line.quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, subtotal, itemCount };
}

export async function resolveCart(): Promise<ResolvedCart> {
  const lines = await getCartLines();
  return resolveCartFromLines(lines);
}
