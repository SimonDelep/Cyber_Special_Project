import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { products, users } from '@/db/schema';
import { findUserById, toPublicUser } from '@/lib/auth/user';
import type { PublicUser } from '@/lib/auth/types';
import { createOrderFromCheckout } from '@/lib/orders';

export interface CheckoutLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutResult {
  total: number;
  previousBalance: number;
  newBalance: number;
  items: CheckoutLineItem[];
  user: PublicUser;
  orderId: string;
  invoiceNumber: string;
}

export async function processCheckout(
  userId: string,
  productIds: string[],
): Promise<CheckoutResult> {
  if (productIds.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const counts = new Map<string, number>();
  for (const id of productIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const ids = [...counts.keys()];
  const db = getDb();

  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, ids));

  if (rows.length !== ids.length) {
    throw new Error('One or more products in your cart are no longer available.');
  }

  const lineItems: CheckoutLineItem[] = rows.map((row) => {
    const quantity = counts.get(row.id) ?? 0;
    const subtotal = Math.round(row.price * quantity * 100) / 100;
    return {
      productId: row.id,
      name: row.name,
      price: row.price,
      quantity,
      subtotal,
    };
  });

  const total = Math.round(
    lineItems.reduce((sum, item) => sum + item.subtotal, 0) * 100,
  ) / 100;

  const userRow = await findUserById(userId);
  if (!userRow) throw new Error('User not found.');

  if (userRow.balance < total) {
    const shortfall = Math.round((total - userRow.balance) * 100) / 100;
    throw new Error(
      `Insufficient account balance. Your total is $${total.toFixed(2)} but you only have $${userRow.balance.toFixed(2)} (short by $${shortfall.toFixed(2)}).`,
    );
  }

  const newBalance = Math.round((userRow.balance - total) * 100) / 100;

  const [updated] = await db
    .update(users)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  const user = toPublicUser(updated);
  const order = await createOrderFromCheckout(user, {
    total,
    previousBalance: userRow.balance,
    newBalance,
    items: lineItems,
  });

  return {
    total,
    previousBalance: userRow.balance,
    newBalance,
    items: lineItems,
    user,
    orderId: order.id,
    invoiceNumber: order.invoiceNumber,
  };
}
