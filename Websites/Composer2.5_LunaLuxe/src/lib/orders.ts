import { db } from '@/db';
import { orders, orderItems, users, type OrderWithItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface OrderLineInput {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

function generateOrderNumber(orderId: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `LL-${date}-${String(orderId).padStart(5, '0')}`;
}

export async function createOrder(data: {
  userId: number;
  total: number;
  balanceAfter: number;
  items: OrderLineInput[];
}): Promise<{ orderId: number; orderNumber: string }> {
  const now = new Date().toISOString();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `LL-PENDING-${Date.now()}`,
      userId: data.userId,
      total: data.total,
      balanceAfter: data.balanceAfter,
      createdAt: now,
    })
    .returning();

  const orderNumber = generateOrderNumber(order.id);
  await db.update(orders).set({ orderNumber }).where(eq(orders.id, order.id));

  await db.insert(orderItems).values(
    data.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }))
  );

  return { orderId: order.id, orderNumber };
}

export async function getOrderWithItems(orderId: number): Promise<OrderWithItems | undefined> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return undefined;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return undefined;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return {
    ...order,
    orderNumber: order.orderNumber.startsWith('LL-PENDING') ? generateOrderNumber(order.id) : order.orderNumber,
    items,
    customerName: user.displayName,
    customerEmail: user.email,
  };
}

export async function getOrdersForUser(userId: number) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}
