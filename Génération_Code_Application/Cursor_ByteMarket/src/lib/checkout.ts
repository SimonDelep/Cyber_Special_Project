import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orderItems, orders, products, users } from "@/db/schema";
import { formatInvoiceNumber } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export type CheckoutLineInput = {
  productId: number;
  qty: number;
};

export type CheckoutLineDetail = {
  productId: number;
  name: string;
  qty: number;
  unitPriceCents: number;
  lineCents: number;
};

export type CheckoutResult =
  | {
      ok: true;
      orderId: number;
      invoiceNumber: string;
      totalCents: number;
      newBalanceCents: number;
      orderSummary: CheckoutLineDetail[];
    }
  | { ok: false; error: string };

function parseLines(raw: unknown): CheckoutLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const lines: CheckoutLineInput[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const productId = Number((entry as CheckoutLineInput).productId);
    const qty = Number((entry as CheckoutLineInput).qty);
    if (!Number.isInteger(productId) || productId < 1) return null;
    if (!Number.isInteger(qty) || qty < 1) return null;
    lines.push({ productId, qty });
  }

  return lines;
}

export function parseCheckoutPayload(json: string): CheckoutLineInput[] | null {
  try {
    const data = JSON.parse(json) as unknown;
    return parseLines(data);
  } catch {
    return null;
  }
}

export function processCheckout(
  userId: number,
  lines: CheckoutLineInput[],
): CheckoutResult {
  if (lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const merged = new Map<number, number>();
  for (const line of lines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.qty);
  }

  const productIds = [...merged.keys()];
  const db = getDb();

  const catalog = db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))
    .all();

  if (catalog.length !== productIds.length) {
    return { ok: false, error: "One or more products in your cart are no longer available." };
  }

  const byId = Object.fromEntries(catalog.map((p) => [p.id, p]));
  let totalCents = 0;
  const orderSummary: CheckoutLineDetail[] = [];

  for (const [productId, qty] of merged) {
    const product = byId[productId];
    if (!product) {
      return { ok: false, error: "One or more products in your cart are no longer available." };
    }
    if (product.stock < qty) {
      return {
        ok: false,
        error: `Not enough stock for "${product.name}" (only ${product.stock} left).`,
      };
    }
    const lineCents = product.priceCents * qty;
    totalCents += lineCents;
    orderSummary.push({
      productId,
      name: product.name,
      qty,
      unitPriceCents: product.priceCents,
      lineCents,
    });
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  if (user.balanceCents < totalCents) {
    const shortfall = totalCents - user.balanceCents;
    return {
      ok: false,
      error: `Insufficient store credit. You need ${formatPrice(totalCents)} but only have ${formatPrice(user.balanceCents)} (${formatPrice(shortfall)} short).`,
    };
  }

  const newBalanceCents = user.balanceCents - totalCents;
  const now = new Date();

  const checkoutResult = db.transaction((tx) => {
    tx.update(users)
      .set({ balanceCents: newBalanceCents, updatedAt: now })
      .where(eq(users.id, userId))
      .run();

    for (const [productId, qty] of merged) {
      const product = byId[productId]!;
      tx.update(products)
        .set({ stock: product.stock - qty })
        .where(eq(products.id, productId))
        .run();
    }

    const [inserted] = tx
      .insert(orders)
      .values({
        userId,
        invoiceNumber: `pending-${userId}-${now.getTime()}`,
        totalCents,
        balanceAfterCents: newBalanceCents,
        createdAt: now,
      })
      .returning({ id: orders.id })
      .all();

    const orderId = inserted!.id;
    const invoiceNumber = formatInvoiceNumber(orderId, now);

    tx.update(orders)
      .set({ invoiceNumber })
      .where(eq(orders.id, orderId))
      .run();

    for (const line of orderSummary) {
      tx.insert(orderItems)
        .values({
          orderId,
          productId: line.productId,
          productName: line.name,
          quantity: line.qty,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.lineCents,
        })
        .run();
    }

    return { orderId, invoiceNumber };
  });

  return {
    ok: true,
    orderId: checkoutResult.orderId,
    invoiceNumber: checkoutResult.invoiceNumber,
    totalCents,
    newBalanceCents,
    orderSummary,
  };
}
