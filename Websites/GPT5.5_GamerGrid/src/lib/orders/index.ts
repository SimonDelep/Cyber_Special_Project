import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { orders } from '@/db/schema';
import type { CheckoutLineItem } from '@/lib/checkout';
import type { PublicUser } from '@/lib/auth/types';
import type { OrderRecord } from '@/lib/orders/types';

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `VS-${y}${m}${d}-${nanoid(6).toUpperCase()}`;
}

function parseLineItems(raw: string): CheckoutLineItem[] {
  const parsed = JSON.parse(raw) as CheckoutLineItem[];
  return Array.isArray(parsed) ? parsed : [];
}

function toOrderRecord(row: typeof orders.$inferSelect): OrderRecord {
  return {
    id: row.id,
    userId: row.userId,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    lineItems: parseLineItems(row.lineItems),
    total: row.total,
    previousBalance: row.previousBalance,
    newBalance: row.newBalance,
    createdAt: row.createdAt,
  };
}

export type CreateOrderInput = {
  items: CheckoutLineItem[];
  total: number;
  previousBalance: number;
  newBalance: number;
};

export async function createOrderFromCheckout(
  user: PublicUser,
  checkout: CreateOrderInput,
): Promise<OrderRecord> {
  const db = getDb();
  const id = nanoid(16);
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date();

  await db.insert(orders).values({
    id,
    userId: user.id,
    invoiceNumber,
    customerName: user.displayName,
    customerEmail: user.email,
    lineItems: JSON.stringify(checkout.items),
    total: checkout.total,
    previousBalance: checkout.previousBalance,
    newBalance: checkout.newBalance,
    createdAt: now,
  });

  return {
    id,
    userId: user.id,
    invoiceNumber,
    customerName: user.displayName,
    customerEmail: user.email,
    lineItems: checkout.items,
    total: checkout.total,
    previousBalance: checkout.previousBalance,
    newBalance: checkout.newBalance,
    createdAt: now,
  };
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const db = getDb();
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return row ? toOrderRecord(row) : null;
}

export function canAccessOrder(
  order: OrderRecord,
  user: { id: string; role: string },
): boolean {
  return order.userId === user.id || user.role === 'admin';
}
