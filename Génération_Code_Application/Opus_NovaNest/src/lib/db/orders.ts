import { getSqlite } from './client';
import type { SafeUser } from './schema';

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type Order = {
  id: number;
  userId: number;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderLineInput = {
  productId: number;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPriceCents: number;
};

type OrderRow = {
  id: number;
  user_id: number;
  invoice_number: string;
  total_cents: number;
  created_at: string;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    totalCents: row.total_cents,
    createdAt: row.created_at,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    lineTotalCents: row.line_total_cents,
  };
}

function buildInvoiceNumber(orderId: number, createdAt: string): string {
  const date = createdAt.slice(0, 10).replace(/-/g, '');
  return `INV-${date}-${String(orderId).padStart(6, '0')}`;
}

export function createOrder(
  userId: number,
  lines: OrderLineInput[],
  totalCents: number,
): OrderWithItems {
  const db = getSqlite();
  const now = new Date().toISOString();

  const insertOrder = db.prepare(
    `INSERT INTO orders (user_id, invoice_number, total_cents, created_at)
     VALUES (?, '', ?, ?)`,
  );
  const orderResult = insertOrder.run(userId, totalCents, now);
  const orderId = Number(orderResult.lastInsertRowid);
  const invoiceNumber = buildInvoiceNumber(orderId, now);

  db.prepare('UPDATE orders SET invoice_number = ? WHERE id = ?').run(
    invoiceNumber,
    orderId,
  );

  const insertItem = db.prepare(
    `INSERT INTO order_items (
      order_id, product_id, product_name, product_slug,
      quantity, unit_price_cents, line_total_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const items: OrderItem[] = [];
  for (const line of lines) {
    const lineTotal = line.unitPriceCents * line.quantity;
    const result = insertItem.run(
      orderId,
      line.productId,
      line.productName,
      line.productSlug,
      line.quantity,
      line.unitPriceCents,
      lineTotal,
    );
    items.push({
      id: Number(result.lastInsertRowid),
      orderId,
      productId: line.productId,
      productName: line.productName,
      productSlug: line.productSlug,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: lineTotal,
    });
  }

  return {
    id: orderId,
    userId,
    invoiceNumber,
    totalCents,
    createdAt: now,
    items,
  };
}

export function getOrderById(orderId: number): OrderWithItems | null {
  const db = getSqlite();
  const row = db
    .prepare('SELECT id, user_id, invoice_number, total_cents, created_at FROM orders WHERE id = ?')
    .get(orderId) as OrderRow | undefined;
  if (!row) return null;

  const itemRows = db
    .prepare(
      `SELECT id, order_id, product_id, product_name, product_slug,
              quantity, unit_price_cents, line_total_cents
       FROM order_items WHERE order_id = ? ORDER BY id`,
    )
    .all(orderId) as OrderItemRow[];

  return {
    ...mapOrder(row),
    items: itemRows.map(mapOrderItem),
  };
}

export function listOrdersByUserId(userId: number, limit = 20): Order[] {
  const db = getSqlite();
  const cap = Math.min(Math.max(limit, 1), 100);
  const rows = db
    .prepare(
      `SELECT id, user_id, invoice_number, total_cents, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT ?`,
    )
    .all(userId, cap) as OrderRow[];
  return rows.map(mapOrder);
}

export type InvoiceCustomer = Pick<
  SafeUser,
  'id' | 'username' | 'email' | 'displayName'
>;
