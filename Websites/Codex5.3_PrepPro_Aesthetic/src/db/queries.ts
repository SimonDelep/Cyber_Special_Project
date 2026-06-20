import { eq, desc } from "drizzle-orm";
import { getDb } from "./client";
import { products, type Product } from "./schema";

export function getFeaturedProducts(): Product[] {
  const db = getDb();
  return db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.createdAt))
    .all();
}

export function getAllProducts(): Product[] {
  const db = getDb();
  return db.select().from(products).orderBy(desc(products.createdAt)).all();
}

export function getProductBySlug(slug: string): Product | undefined {
  const db = getDb();
  const rows = db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1)
    .all();
  return rows[0];
}
