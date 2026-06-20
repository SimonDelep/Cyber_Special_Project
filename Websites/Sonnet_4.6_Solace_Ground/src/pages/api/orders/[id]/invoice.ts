import type { APIRoute } from 'astro';
import { errorResponse } from '@/lib/api';
import { isAdmin } from '@/lib/auth/rbac';
import { generateInvoicePdf } from '@/lib/invoices/generate-pdf';
import { getOrderWithDetails } from '@/lib/orders/queries';

export const prerender = false;

function parseOrderId(params: APIRoute['params']): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return errorResponse('Sign in to download your invoice.', 401);
  }

  const orderId = parseOrderId(params);
  if (!orderId) {
    return errorResponse('Invalid order id.', 400);
  }

  const order = getOrderWithDetails(orderId);
  if (!order) {
    return errorResponse('Order not found.', 404);
  }

  if (order.userId !== locals.user.id && !isAdmin(locals.user)) {
    return errorResponse('You do not have access to this invoice.', 403);
  }

  const pdf = await generateInvoicePdf(order);
  const filename = `invoice-${order.invoiceNumber}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
