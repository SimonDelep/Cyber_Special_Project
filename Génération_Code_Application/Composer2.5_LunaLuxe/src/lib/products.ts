import { db } from '@/db';
import { products, productCategories, type Product, type ProductCategory } from '@/db/schema';
import { and, asc, desc, eq, gte, like, lte, or } from 'drizzle-orm';

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name';

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
  sort?: ProductSort;
}

export function isValidProductCategory(value: string): value is ProductCategory {
  return (productCategories as readonly string[]).includes(value);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.createdAt));
}

export async function getAllProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return product;
}

export async function searchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const conditions = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(or(like(products.name, term), like(products.description, term)));
  }

  if (filters.category && isValidProductCategory(filters.category)) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice)) {
    conditions.push(gte(products.price, filters.minPrice));
  }

  if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) {
    conditions.push(lte(products.price, filters.maxPrice));
  }

  if (filters.featuredOnly) {
    conditions.push(eq(products.featured, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(products).$dynamic();
  if (whereClause) query = query.where(whereClause);

  switch (filters.sort) {
    case 'price-asc':
      return query.orderBy(asc(products.price));
    case 'price-desc':
      return query.orderBy(desc(products.price));
    case 'name':
      return query.orderBy(asc(products.name));
    case 'newest':
    default:
      return query.orderBy(desc(products.createdAt));
  }
}
