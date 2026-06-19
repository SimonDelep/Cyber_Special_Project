import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders, orderItems, users } from '@/db/schema';

export type OrderWithDetails = {
  id: number;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
  userId: number;
  username: string;
  email: string;
  displayName: string | null;
  items: {
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export function getOrderWithDetails(orderId: number): OrderWithDetails | null {
  const db = getDb();
  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) return null;

  const user = db.select().from(users).where(eq(users.id, order.userId)).get();
  if (!user) return null;

  const items = db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .all();

  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
    userId: order.userId,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
  };
}
