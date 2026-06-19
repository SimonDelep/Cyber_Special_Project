import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../lib/auth/session';
import { processCheckout, type CheckoutLineInput } from '../../lib/checkout';
import { errorResponse, jsonResponse, parseJsonBody } from '../../lib/api/response';
import { logEvent } from '../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../lib/events/constants';

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) {
    logEvent({
      category: EVENT_CATEGORY.TRANSACTION,
      action: EVENT_ACTION.CHECKOUT,
      outcome: EVENT_OUTCOME.DENIED,
      message: 'Checkout attempted without authentication.',
      request,
    });
    return errorResponse('Sign in to complete checkout.', 401);
  }

  const body = await parseJsonBody<{ items?: CheckoutLineInput[] }>(request);
  if (!body || !Array.isArray(body.items)) {
    return errorResponse('Invalid request body. Expected { items: [...] }.');
  }

  const result = processCheckout(user.id, body.items);

  if (!result.ok) {
    const status = result.error.includes('Insufficient') ? 402 : 400;
    logEvent({
      category: EVENT_CATEGORY.TRANSACTION,
      action: EVENT_ACTION.CHECKOUT,
      outcome: EVENT_OUTCOME.FAILURE,
      message: `Checkout failed for "${user.username}": ${result.error}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: {
        itemCount: body.items.length,
        balanceCents: user.balanceCents,
      },
    });
    return errorResponse(result.error, status);
  }

  logEvent({
    category: EVENT_CATEGORY.TRANSACTION,
    action: EVENT_ACTION.CHECKOUT,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Checkout completed for "${user.username}" (${result.totalCents} cents).`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      orderId: result.order.id,
      invoiceNumber: result.order.invoiceNumber,
      totalCents: result.totalCents,
      newBalanceCents: result.user.balanceCents,
      itemCount: body.items.length,
    },
  });

  return jsonResponse({
    ok: true,
    user: result.user,
    totalCents: result.totalCents,
    order: {
      id: result.order.id,
      invoiceNumber: result.order.invoiceNumber,
      createdAt: result.order.createdAt,
    },
    invoiceUrl: `/api/orders/${result.order.id}/invoice`,
    message: 'Order completed successfully. Your account balance has been updated.',
  });
};
