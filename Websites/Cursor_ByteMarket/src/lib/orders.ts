import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orderItems, orders, users } from "@/db/schema";

export type OrderLineRecord = {
  productId: number;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type InvoiceOrder = {
  id: number;
  invoiceNumber: string;
  totalCents: number;
  balanceAfterCents: number;
  createdAt: Date;
  userId: number;
  username: string;
  displayName: string | null;
  email: string | null;
  lines: OrderLineRecord[];
};

export function formatInvoiceNumber(orderId: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(orderId).padStart(6, "0");
  return `BM-${y}${m}${d}-${seq}`;
}

export function getOrderForUser(
  orderId: number,
  userId: number,
): InvoiceOrder | null {
  const db = getDb();

  const [order] = db
    .select({
      id: orders.id,
      invoiceNumber: orders.invoiceNumber,
      totalCents: orders.totalCents,
      balanceAfterCents: orders.balanceAfterCents,
      createdAt: orders.createdAt,
      userId: orders.userId,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .all();

  if (!order) return null;

  const lines = db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      lineTotalCents: orderItems.lineTotalCents,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .all()
    .map((line) => ({
      productId: line.productId ?? 0,
      productName: line.productName,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
    }));

  return { ...order, lines };
}

export function listRecentOrdersForUser(userId: number, limit = 10) {
  const db = getDb();
  return db
    .select({
      id: orders.id,
      invoiceNumber: orders.invoiceNumber,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .all();
}
