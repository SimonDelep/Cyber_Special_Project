import { and, eq, gte, lte, or, sql, like, type SQL } from 'drizzle-orm';
import { getDb } from '@/db';
import { products, reviews } from '@/db/schema';
import { toPublicProduct } from '@/types/product';
import type { CatalogProduct } from '@/types/review';

export type CatalogFilters = {
  q?: string;
  category?: string;
  inStock?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
};

export function queryCatalog(filters: CatalogFilters): CatalogProduct[] {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(like(products.name, term), like(products.description, term))!,
    );
  }

  if (filters.category && filters.category !== 'all') {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.inStock === true) {
    conditions.push(eq(products.inStock, true));
  }

  if (filters.minPriceCents !== undefined) {
    conditions.push(gte(products.priceCents, filters.minPriceCents));
  }

  if (filters.maxPriceCents !== undefined) {
    conditions.push(lte(products.priceCents, filters.maxPriceCents));
  }

  const rows = db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(products.category, products.name)
    .all();

  const stats = db
    .select({
      productId: reviews.productId,
      reviewCount: sql<number>`count(*)`.mapWith(Number),
      averageRating: sql<number>`avg(${reviews.rating})`.mapWith(Number),
    })
    .from(reviews)
    .groupBy(reviews.productId)
    .all();

  const statsByProduct = new Map(
    stats.map((s) => [
      s.productId,
      { reviewCount: s.reviewCount, averageRating: s.averageRating },
    ]),
  );

  let result: CatalogProduct[] = rows.map((p) => {
    const s = statsByProduct.get(p.id);
    const reviewCount = s?.reviewCount ?? 0;
    const averageRating =
      s?.averageRating != null ? Math.round(s.averageRating * 10) / 10 : null;

    return {
      ...toPublicProduct(p),
      reviewCount,
      averageRating,
    };
  });

  if (filters.minRating !== undefined && filters.minRating > 0) {
    result = result.filter(
      (p) => p.averageRating !== null && p.averageRating >= filters.minRating!,
    );
  }

  return result;
}

export function getProductBySlug(slug: string) {
  const db = getDb();
  return db.select().from(products).where(eq(products.slug, slug)).get();
}
