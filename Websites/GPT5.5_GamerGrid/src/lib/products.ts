import { and, asc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { categories, products } from '@/db/schema';
import type { CategoryDTO, ProductDTO, ProductFilters } from '@/lib/types';

const productFields = {
  id: products.id,
  categoryId: products.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
  name: products.name,
  slug: products.slug,
  description: products.description,
  price: products.price,
  image: products.image,
  badge: products.badge,
  featured: products.featured,
};

export async function getAllCategories(): Promise<CategoryDTO[]> {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getAllProducts(): Promise<ProductDTO[]> {
  const db = getDb();
  return db
    .select(productFields)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(categories.name), asc(products.name));
}

export async function searchProducts(filters: ProductFilters = {}): Promise<ProductDTO[]> {
  const db = getDb();
  const conditions = [];

  if (filters.categorySlug) {
    conditions.push(eq(categories.slug, filters.categorySlug));
  }

  if (filters.featuredOnly) {
    conditions.push(eq(products.featured, true));
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice));
  }

  const term = filters.search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      or(
        like(products.name, pattern),
        like(products.description, pattern),
        like(categories.name, pattern),
      )!,
    );
  }

  const query = db
    .select(productFields)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(asc(products.name));
  }

  return query.orderBy(asc(categories.name), asc(products.name));
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const db = getDb();
  const [row] = await db
    .select(productFields)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const db = getDb();
  const [row] = await db
    .select(productFields)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);
  return row ?? null;
}

export async function getProductPriceBounds(): Promise<{ min: number; max: number }> {
  const db = getDb();
  const [row] = await db
    .select({
      min: sql<number>`min(${products.price})`,
      max: sql<number>`max(${products.price})`,
    })
    .from(products);
  return { min: row?.min ?? 0, max: row?.max ?? 500 };
}

export async function getFeaturedProducts(): Promise<ProductDTO[]> {
  return searchProducts({ featuredOnly: true });
}
