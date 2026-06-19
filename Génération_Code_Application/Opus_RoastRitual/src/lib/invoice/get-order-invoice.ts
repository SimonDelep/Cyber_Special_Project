import { db } from "@/lib/db";
import type { InvoiceData } from "@/lib/invoice/types";

export async function getOrderInvoiceData(
  orderId: string,
  userId: string,
): Promise<InvoiceData | null> {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      totalCents: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          quantity: true,
          priceCents: true,
          product: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  const lineItems = order.items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    unitPriceCents: item.priceCents,
    lineTotalCents: item.priceCents * item.quantity,
  }));

  return {
    invoiceNumber: order.id.slice(-8).toUpperCase(),
    orderId: order.id,
    issuedAt: order.createdAt,
    customer: {
      name: order.user.name ?? order.user.username,
      username: order.user.username,
      email: order.user.email,
    },
    lineItems,
    totalCents: order.totalCents,
    paymentMethod: "RoastRitual account balance (simulated)",
  };
}
