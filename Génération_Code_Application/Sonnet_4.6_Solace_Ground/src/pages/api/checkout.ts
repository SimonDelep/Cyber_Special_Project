import type { APIRoute } from 'astro';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { products, users } from '@/db/schema';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toPublicUser } from '@/types/auth';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';
import { createOrderFromCheckout } from '@/lib/orders/create';

export const prerender = false;

type CheckoutItem = { productId: number; quantity: number };

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return errorResponse('Sign in to complete checkout.', 401);
  }

  const body = await parseJsonBody<{ items?: CheckoutItem[] }>(request);

  if (!body?.items?.length) {
    return errorResponse('Your cart is empty.', 400);
  }

  const merged = new Map<number, number>();
  for (const item of body.items) {
    if (
      !Number.isInteger(item.productId) ||
      item.productId < 1 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return errorResponse('Invalid cart item.', 400);
    }
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  const checkoutItems = [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  const db = getDb();
  const productIds = checkoutItems.map((i) => i.productId);
  const catalog = db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))
    .all();

  const byId = new Map(catalog.map((p) => [p.id, p]));
  let totalCents = 0;
  const purchased: {
    productId: number;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[] = [];

  for (const item of checkoutItems) {
    const product = byId.get(item.productId);
    if (!product) {
      return errorResponse('One or more products are no longer available.', 400);
    }
    if (!product.inStock) {
      return errorResponse(`${product.name} is out of stock.`, 400);
    }
    const lineTotal = product.priceCents * item.quantity;
    totalCents += lineTotal;
    purchased.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      lineTotalCents: lineTotal,
    });
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();

  if (!user) {
    return errorResponse('User not found.', 404);
  }

  if (user.balanceCents < totalCents) {
    const shortfall = totalCents - user.balanceCents;
    logEvent({
      action: LOG_ACTIONS.TRANSACTION_CHECKOUT_INSUFFICIENT,
      category: 'transaction',
      status: 'failure',
      severity: 'warning',
      message: `Checkout declined — insufficient balance for ${user.username}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: {
        totalCents,
        balanceCents: user.balanceCents,
        shortfallCents: shortfall,
        itemCount: checkoutItems.length,
      },
    });
    return jsonResponse(
      {
        error: 'Insufficient balance',
        message: `Your balance is ${formatPrice(user.balanceCents)}, but this order totals ${formatPrice(totalCents)}. You need ${formatPrice(shortfall)} more to complete checkout.`,
        balanceCents: user.balanceCents,
        totalCents,
        shortfallCents: shortfall,
      },
      402,
    );
  }

  const newBalanceCents = user.balanceCents - totalCents;
  const updated = db
    .update(users)
    .set({
      balanceCents: newBalanceCents,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, locals.user.id))
    .returning()
    .get();

  const order = createOrderFromCheckout(
    user.id,
    totalCents,
    purchased.map((line) => ({
      productId: line.productId,
      productName: line.name,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
    })),
  );

  logEvent({
    action: LOG_ACTIONS.TRANSACTION_CHECKOUT_SUCCESS,
    category: 'transaction',
    status: 'success',
    message: `Checkout completed: ${formatPrice(totalCents)} charged to ${user.username}`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      totalCents,
      newBalanceCents,
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      items: purchased,
    },
  });

  return jsonResponse({
    ok: true,
    message: `Order complete! ${formatPrice(totalCents)} was deducted from your account.`,
    totalCents,
    newBalanceCents,
    items: purchased,
    order: {
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
    },
    user: toPublicUser(updated),
  });
};
