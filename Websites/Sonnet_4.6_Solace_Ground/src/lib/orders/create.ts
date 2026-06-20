import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders, orderItems } from '@/db/schema';

export type CheckoutLineInput = {
  productId: number;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type CreatedOrder = {
  id: number;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
};

function buildInvoiceNumber(orderId: number, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  return `SG-${year}-${String(orderId).padStart(6, '0')}`;
}

export function createOrderFromCheckout(
  userId: number,
  totalCents: number,
  lines: CheckoutLineInput[],
): CreatedOrder {
  const db = getDb();
  const createdAt = new Date().toISOString();

  return db.transaction((tx) => {
    const order = tx
      .insert(orders)
      .values({
        userId,
        invoiceNumber: `SG-PENDING-${Date.now()}`,
        totalCents,
        createdAt,
      })
      .returning()
      .get();

    const invoiceNumber = buildInvoiceNumber(order.id, createdAt);
    tx.update(orders)
      .set({ invoiceNumber })
      .where(eq(orders.id, order.id))
      .run();

    for (const line of lines) {
      tx.insert(orderItems)
        .values({
          orderId: order.id,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.lineTotalCents,
        })
        .run();
    }

    return {
      id: order.id,
      invoiceNumber,
      totalCents,
      createdAt,
    };
  });
}
