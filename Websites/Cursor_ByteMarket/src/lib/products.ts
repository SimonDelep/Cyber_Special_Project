import {
  and,
  asc,
  desc,
  eq,
  gte,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

const catalogSelect = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  description: products.description,
  priceCents: products.priceCents,
  stock: products.stock,
  imageUrl: products.imageUrl,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

/** Products shown on the landing page (all catalog items, up to limit). */
export async function getLandingProducts(limit = 6): Promise<CatalogProduct[]> {
  const db = getDb();
  return db
    .select(catalogSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.name))
    .limit(limit);
}

export async function getFeaturedProducts(limit = 4) {
  const db = getDb();
  return db
    .select(catalogSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.featured, true))
    .orderBy(desc(products.id))
    .limit(limit);
}

export async function getCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(categories.name);
}

export type CatalogSort =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc";

export type CatalogFilters = {
  q?: string;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
  sort?: CatalogSort;
};

function catalogOrderBy(sort: CatalogSort = "name_asc") {
  switch (sort) {
    case "name_desc":
      return desc(products.name);
    case "price_asc":
      return asc(products.priceCents);
    case "price_desc":
      return desc(products.priceCents);
    default:
      return asc(products.name);
  }
}

export async function searchCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogProduct[]> {
  const db = getDb();
  const conditions = [];

  const query = filters.q?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        like(products.name, pattern),
        like(products.description, pattern),
        like(categories.name, pattern),
      ),
    );
  }

  if (filters.category) {
    conditions.push(eq(categories.slug, filters.category));
  }

  if (filters.minPriceCents != null && filters.minPriceCents >= 0) {
    conditions.push(gte(products.priceCents, filters.minPriceCents));
  }

  if (filters.maxPriceCents != null && filters.maxPriceCents >= 0) {
    conditions.push(lte(products.priceCents, filters.maxPriceCents));
  }

  if (filters.inStockOnly) {
    conditions.push(sql`${products.stock} > 0`);
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select(catalogSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(catalogOrderBy(filters.sort));
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const db = getDb();
  const [row] = await db
    .select(catalogSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  return row ?? null;
}

export function parseCatalogSort(value: string | null): CatalogSort {
  const allowed: CatalogSort[] = [
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
  ];
  if (value && allowed.includes(value as CatalogSort)) {
    return value as CatalogSort;
  }
  return "name_asc";
}

export function parsePriceDollarsToCents(value: string | null): number | null {
  if (!value?.trim()) return null;
  const dollars = Number(value.replace(",", "."));
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
