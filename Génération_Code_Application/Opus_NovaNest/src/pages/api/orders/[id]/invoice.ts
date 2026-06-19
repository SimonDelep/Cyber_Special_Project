import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../../lib/auth/session';
import { findUserById } from '../../../../lib/db/users';
import { getOrderById } from '../../../../lib/db/orders';
import { generateInvoicePdf } from '../../../../lib/invoices/pdf';
import { errorResponse } from '../../../../lib/api/response';

function parseOrderId(params: { id?: string }): number | null {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const GET: APIRoute = async ({ params, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Not authenticated.', 401);

  const orderId = parseOrderId(params);
  if (!orderId) return errorResponse('Invalid order id.');

  const order = getOrderById(orderId);
  if (!order) return errorResponse('Order not found.', 404);

  if (order.userId !== user.id && user.role !== 'admin') {
    return errorResponse('You do not have access to this invoice.', 403);
  }

  const customer = findUserById(order.userId);
  if (!customer) return errorResponse('Customer not found.', 404);

  const pdfBytes = await generateInvoicePdf(order, {
    id: customer.id,
    username: customer.username,
    email: customer.email,
    displayName: customer.displayName,
  });

  const filename = `${order.invoiceNumber}.pdf`;

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  });
};
