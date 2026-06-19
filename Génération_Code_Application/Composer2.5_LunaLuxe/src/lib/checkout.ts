import { findUserById } from '@/lib/auth/users';
import { setUserBalance } from '@/lib/admin/users';
import { getProductById } from '@/lib/admin/products';
import { createOrder } from '@/lib/orders';
import { formatCurrency } from '@/lib/format';

export interface CheckoutLineItem {
  productId: number;
  quantity: number;
}

export interface CheckoutResult {
  success: boolean;
  total: number;
  newBalance?: number;
  orderId?: number;
  orderNumber?: string;
  error?: string;
}

export async function processCheckout(
  userId: number,
  lineItems: CheckoutLineItem[]
): Promise<CheckoutResult> {
  if (!lineItems.length) {
    return { success: false, total: 0, error: 'Your cart is empty.' };
  }

  let total = 0;
  const resolvedItems: {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];

  for (const line of lineItems) {
    if (!Number.isInteger(line.productId) || line.productId <= 0) {
      return { success: false, total: 0, error: 'Invalid cart item.' };
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 99) {
      return { success: false, total: 0, error: 'Invalid quantity in cart.' };
    }

    const product = await getProductById(line.productId);
    if (!product) {
      return { success: false, total: 0, error: `Product #${line.productId} is no longer available.` };
    }

    const lineTotal = Math.round(product.price * line.quantity * 100) / 100;
    total += lineTotal;
    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal,
    });
  }

  total = Math.round(total * 100) / 100;

  const user = await findUserById(userId);
  if (!user) {
    return { success: false, total, error: 'User account not found.' };
  }

  const balance = user.balance ?? 0;

  if (balance < total) {
    const shortfall = total - balance;
    return {
      success: false,
      total,
      error: `Insufficient funds. Your balance is ${formatCurrency(balance)} but the order total is ${formatCurrency(total)}. You need ${formatCurrency(shortfall)} more.`,
    };
  }

  const newBalance = Math.round((balance - total) * 100) / 100;
  await setUserBalance(userId, newBalance);

  const { orderId, orderNumber } = await createOrder({
    userId,
    total,
    balanceAfter: newBalance,
    items: resolvedItems,
  });

  return { success: true, total, newBalance, orderId, orderNumber };
}
