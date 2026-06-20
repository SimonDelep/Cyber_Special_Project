import type { APIRoute } from 'astro';
import { processCheckout } from '@/lib/checkout';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user ?? null;
  if (!user) {
    return redirectResponse('/login?redirect=/checkout');
  }

  const form = await request.formData();
  const itemsRaw = String(form.get('items') ?? '');

  let lineItems: { productId: number; quantity: number }[];
  try {
    lineItems = JSON.parse(itemsRaw);
    if (!Array.isArray(lineItems)) throw new Error('Invalid format');
  } catch {
    await logEvent({
      eventType: EventType.TRANSACTION_CHECKOUT_FAILED,
      severity: 'error',
      message: `Checkout failed for "${user.username}": invalid cart data`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { reason: 'invalid_cart' },
    });
    return redirectResponse('/checkout?error=Invalid+cart+data');
  }

  const result = await processCheckout(user.id, lineItems);

  if (!result.success) {
    await logEvent({
      eventType: EventType.TRANSACTION_CHECKOUT_FAILED,
      severity: 'warning',
      message: `Checkout failed for "${user.username}": ${result.error}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { total: result.total, itemCount: lineItems.length, error: result.error },
    });
    return redirectResponse(`/checkout?error=${encodeURIComponent(result.error ?? 'Checkout failed')}`);
  }

  await logEvent({
    eventType: EventType.TRANSACTION_CHECKOUT_SUCCESS,
    severity: 'success',
    message: `Checkout completed for "${user.username}" — $${result.total?.toFixed(2)} CAD`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      total: result.total,
      newBalance: result.newBalance,
      itemCount: lineItems.length,
      items: lineItems,
    },
  });

  const params = new URLSearchParams({
    success: '1',
    orderId: String(result.orderId),
    orderNumber: result.orderNumber ?? '',
    total: String(result.total),
    balance: String(result.newBalance),
  });

  return redirectResponse(`/checkout?${params.toString()}`);
};
