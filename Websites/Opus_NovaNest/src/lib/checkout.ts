import { getProductById } from './db/products';
import { createOrder, type OrderLineInput, type OrderWithItems } from './db/orders';
import { adjustUserBalance, findUserById, toSafeUser } from './db/users';
import type { SafeUser } from './db/schema';

export type CheckoutLineInput = {
  productId: number;
  quantity: number;
};

export type CheckoutResult =
  | { ok: true; user: SafeUser; totalCents: number; order: OrderWithItems }
  | { ok: false; error: string };

const MAX_QUANTITY = 99;

export function processCheckout(
  userId: number,
  lines: CheckoutLineInput[],
): CheckoutResult {
  if (!lines.length) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  const user = findUserById(userId);
  if (!user) {
    return { ok: false, error: 'User not found.' };
  }

  let totalCents = 0;
  const seen = new Set<number>();
  const resolvedLines: OrderLineInput[] = [];

  for (const line of lines) {
    if (!Number.isInteger(line.productId) || line.productId < 1) {
      return { ok: false, error: 'Invalid cart item.' };
    }
    if (seen.has(line.productId)) {
      return { ok: false, error: 'Duplicate product in cart.' };
    }
    seen.add(line.productId);

    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, error: 'Invalid quantity.' };
    }
    if (line.quantity > MAX_QUANTITY) {
      return { ok: false, error: `Maximum quantity per item is ${MAX_QUANTITY}.` };
    }

    const product = getProductById(line.productId);
    if (!product) {
      return { ok: false, error: `Product #${line.productId} is no longer available.` };
    }

    const lineTotal = product.priceCents * line.quantity;
    totalCents += lineTotal;
    resolvedLines.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
    });
  }

  if (totalCents <= 0) {
    return { ok: false, error: 'Cart total must be greater than zero.' };
  }

  if (user.balanceCents < totalCents) {
    const shortfall = totalCents - user.balanceCents;
    return {
      ok: false,
      error: `Insufficient account balance. You need ${formatMoney(shortfall)} more to complete this order.`,
    };
  }

  const debited = adjustUserBalance(userId, -totalCents);
  if (!debited) {
    return {
      ok: false,
      error: 'Insufficient account balance. Please refresh and try again.',
    };
  }

  try {
    const order = createOrder(userId, resolvedLines, totalCents);
    return {
      ok: true,
      user: toSafeUser(debited),
      totalCents,
      order,
    };
  } catch (err) {
    adjustUserBalance(userId, totalCents);
    console.error('[checkout] Order creation failed, balance refunded:', err);
    return { ok: false, error: 'Checkout failed while saving your order. Please try again.' };
  }
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100);
}
