import type { APIRoute } from 'astro';
import { requireAuthApi } from '@/lib/auth/guards';
import { buildInvoicePdf, invoicePdfFilename } from '@/lib/invoice/pdf';
import { errorResponse } from '@/lib/http';
import { canAccessOrder, getOrderById } from '@/lib/orders';

export const GET: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const { orderId } = context.params;
  if (!orderId) {
    return errorResponse('Order id is required.', 400);
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return errorResponse('Invoice not found.', 404);
  }

  if (!canAccessOrder(order, user)) {
    return errorResponse('You do not have access to this invoice.', 403);
  }

  try {
    const pdf = await buildInvoicePdf(order);
    const filename = invoicePdfFilename(order.invoiceNumber);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return errorResponse('Failed to generate invoice PDF.', 500);
  }
};
