import { eq, desc } from "drizzle-orm";
import { getDb } from "./client";
import { products, type Product, type NewProduct } from "./schema";

export function listProducts(): Product[] {
  const db = getDb();
  return db.select().from(products).orderBy(desc(products.createdAt)).all();
}

export function findProductById(id: number): Product | undefined {
  const db = getDb();
  return db.select().from(products).where(eq(products.id, id)).limit(1).all()[0];
}

export function findProductBySlug(slug: string): Product | undefined {
  const db = getDb();
  return db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1)
    .all()[0];
}

export function slugTaken(slug: string, excludeId?: number): boolean {
  const existing = findProductBySlug(slug);
  if (!existing) return false;
  return excludeId === undefined || existing.id !== excludeId;
}

export function createProduct(data: NewProduct): Product {
  const db = getDb();
  const inserted = db.insert(products).values(data).returning().all();
  return inserted[0]!;
}

export function updateProduct(
  id: number,
  data: Partial<Omit<NewProduct, "id" | "createdAt">>,
): Product | undefined {
  const db = getDb();
  db.update(products).set(data).where(eq(products.id, id)).run();
  return findProductById(id);
}

export function deleteProduct(id: number): void {
  const db = getDb();
  db.delete(products).where(eq(products.id, id)).run();
}
