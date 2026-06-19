import { eq, desc } from "drizzle-orm";
import { getDb } from "./client";
import { orders } from "./schema";
import type { OrderLine, OrderRecord } from "@/lib/invoices/types";

function buildInvoiceNumber(id: number, createdAt: string): string {
  const ymd = createdAt.slice(0, 10).replace(/-/g, "");
  return `PPA-${ymd}-${String(id).padStart(5, "0")}`;
}

function toOrderRecord(row: typeof orders.$inferSelect): OrderRecord {
  let lines: OrderLine[] = [];
  try {
    lines = JSON.parse(row.linesJson) as OrderLine[];
  } catch {
    lines = [];
  }

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    userId: row.userId,
    totalCents: row.totalCents,
    lines,
    customerDisplayName: row.customerDisplayName,
    customerEmail: row.customerEmail,
    customerUsername: row.customerUsername,
    createdAt: row.createdAt,
  };
}

export function createOrder(data: {
  userId: number;
  totalCents: number;
  lines: OrderLine[];
  customerDisplayName: string;
  customerEmail: string;
  customerUsername: string;
}): OrderRecord {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const linesJson = JSON.stringify(data.lines);

  const inserted = db
    .insert(orders)
    .values({
      invoiceNumber: `PPA-TEMP-${Date.now()}`,
      userId: data.userId,
      totalCents: data.totalCents,
      linesJson,
      customerDisplayName: data.customerDisplayName,
      customerEmail: data.customerEmail,
      customerUsername: data.customerUsername,
      createdAt,
    })
    .returning()
    .all()[0]!;

  const invoiceNumber = buildInvoiceNumber(inserted.id, createdAt);

  db.update(orders)
    .set({ invoiceNumber })
    .where(eq(orders.id, inserted.id))
    .run();

  return toOrderRecord({ ...inserted, invoiceNumber });
}

export function findOrderById(id: number): OrderRecord | undefined {
  const db = getDb();
  const row = db.select().from(orders).where(eq(orders.id, id)).limit(1).all()[0];
  return row ? toOrderRecord(row) : undefined;
}

export function listOrdersByUserId(userId: number, limit = 20): OrderRecord[] {
  const db = getDb();
  const rows = db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .all();
  return rows.map(toOrderRecord);
}
