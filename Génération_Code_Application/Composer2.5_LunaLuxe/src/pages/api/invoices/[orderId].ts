import type { APIRoute } from 'astro';
import { getOrderWithItems } from '@/lib/orders';
import { generateInvoicePdf } from '@/lib/invoices/pdf';
import { canAccessAdmin } from '@/lib/auth/rbac';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user ?? null;
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orderId = Number(params.orderId);
  if (!orderId || !Number.isInteger(orderId)) {
    return new Response('Invalid order', { status: 400 });
  }

  const order = await getOrderWithItems(orderId);
  if (!order) {
    return new Response('Order not found', { status: 404 });
  }

  const isOwner = order.userId === user.id;
  const isAdmin = canAccessAdmin(user.role);

  if (!isOwner && !isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  const pdfBuffer = await generateInvoicePdf(order);
  const filename = `lunaluxe-invoice-${order.orderNumber}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'private, no-cache',
    },
  });
};
