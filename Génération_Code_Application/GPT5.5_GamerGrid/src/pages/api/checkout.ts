import type { APIRoute } from 'astro';
import { requireAuthApi } from '@/lib/auth/guards';
import { processCheckout } from '@/lib/checkout';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const body = await parseJsonBody<{ productIds?: string[] }>(context.request);
  if (body instanceof Response) return body;

  if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
    return errorResponse('productIds array is required.', 400);
  }

  const productIds = body.productIds.filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );

  if (productIds.length === 0) {
    return errorResponse('No valid product ids provided.', 400);
  }

  try {
    const result = await processCheckout(user.id, productIds);
    await logEvent({
      category: 'transaction',
      action: EventAction.CHECKOUT_SUCCESS,
      severity: 'info',
      status: 'success',
      message: `Checkout completed: $${result.total.toFixed(2)} charged to ${user.username}.`,
      userId: user.id,
      username: user.username,
      metadata: {
        total: result.total,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        itemCount: result.items.length,
        productIds: result.items.map((i) => i.productId),
        orderId: result.orderId,
        invoiceNumber: result.invoiceNumber,
      },
      request: context.request,
    });
    return jsonResponse({
      ok: true,
      message: `Order complete! $${result.total.toFixed(2)} charged to your account.`,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed.';
    const status = message.includes('Insufficient') ? 402 : 400;
    await logEvent({
      category: 'transaction',
      action: EventAction.CHECKOUT_FAILURE,
      severity: message.includes('Insufficient') ? 'warning' : 'error',
      status: 'failure',
      message: `Checkout failed for ${user.username}: ${message}`,
      userId: user.id,
      username: user.username,
      metadata: { productIds, productCount: productIds.length },
      request: context.request,
    });
    return errorResponse(message, status);
  }
};
