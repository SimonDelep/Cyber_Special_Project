import { eq, and, or, like, gte, lte, desc, asc, sql } from "drizzle-orm";
import { getDb } from "./client";
import { products, type Product } from "./schema";
import type { ProductCategory } from "@/lib/products/validate";

export type CatalogFilters = {
  q?: string;
  category?: ProductCategory | "";
  featured?: boolean | "";
  stackable?: boolean | "";
  leakProof?: boolean | "";
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
};

export function searchProducts(filters: CatalogFilters): Product[] {
  const db = getDb();
  const conditions = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(like(products.name, term), like(products.description, term)),
    );
  }

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.featured === true) {
    conditions.push(eq(products.featured, true));
  }

  if (filters.stackable === true) {
    conditions.push(eq(products.stackable, true));
  }

  if (filters.leakProof === true) {
    conditions.push(eq(products.leakProof, true));
  }

  if (filters.minPriceCents != null && filters.minPriceCents >= 0) {
    conditions.push(gte(products.priceCents, filters.minPriceCents));
  }

  if (filters.maxPriceCents != null && filters.maxPriceCents >= 0) {
    conditions.push(lte(products.priceCents, filters.maxPriceCents));
  }

  let query = db.select().from(products);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const sort = filters.sort ?? "newest";
  if (sort === "price-asc") {
    return query.orderBy(asc(products.priceCents)).all();
  }
  if (sort === "price-desc") {
    return query.orderBy(desc(products.priceCents)).all();
  }
  if (sort === "name") {
    return query.orderBy(asc(products.name)).all();
  }
  return query.orderBy(desc(products.createdAt)).all();
}
