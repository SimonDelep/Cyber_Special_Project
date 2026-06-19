import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";
import type { Product } from "@/db/schema";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductWithCategory = Product & {
  categoryName: string | null;
  categorySlug: string | null;
};

export function validateProductSlug(slug: string): string | null {
  const value = slug.trim().toLowerCase();
  if (!value) return "Slug is required.";
  if (value.length > 80) return "Slug must be 80 characters or fewer.";
  if (!SLUG_PATTERN.test(value)) {
    return "Slug may only contain lowercase letters, numbers, and hyphens.";
  }
  return null;
}

export function parsePriceToCents(priceInput: string): { cents?: number; error?: string } {
  const normalized = priceInput.trim().replace(",", ".");
  if (!normalized) return { error: "Price is required." };
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Enter a valid price." };
  }
  return { cents: Math.round(value * 100) };
}

export function listAllProducts(): ProductWithCategory[] {
  const db = getDb();
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      stock: products.stock,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.id))
    .all() as ProductWithCategory[];
}

export function getProductById(id: number): ProductWithCategory | undefined {
  const db = getDb();
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      stock: products.stock,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .get() as ProductWithCategory | undefined;
}

export function listCategoriesForSelect() {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.name)).all();
}

function slugTaken(slug: string, excludeId?: number): boolean {
  const db = getDb();
  const row = db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
  if (!row) return false;
  if (excludeId !== undefined && row.id === excludeId) return false;
  return true;
}

export function createProduct(input: {
  slug: string;
  name: string;
  description?: string;
  priceCents: number;
  stock: number;
  categoryId?: number | null;
  imageUrl?: string | null;
  featured?: boolean;
}): { product?: Product; error?: string } {
  const slug = input.slug.trim().toLowerCase();
  const slugError = validateProductSlug(slug);
  if (slugError) return { error: slugError };

  if (!input.name.trim()) return { error: "Product name is required." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return { error: "Price must be non-negative." };
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { error: "Stock must be a non-negative integer." };
  }
  if (slugTaken(slug)) return { error: "This slug is already in use." };

  const db = getDb();
  const inserted = db
    .insert(products)
    .values({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      stock: input.stock,
      categoryId: input.categoryId ?? null,
      imageUrl: input.imageUrl?.trim() || null,
      featured: input.featured ?? false,
    })
    .returning()
    .get();

  return { product: inserted };
}

export function updateProduct(
  productId: number,
  input: {
    slug?: string;
    name?: string;
    description?: string;
    priceCents?: number;
    stock?: number;
    categoryId?: number | null;
    imageUrl?: string | null;
    featured?: boolean;
  },
): { product?: Product; error?: string } {
  const existing = getProductById(productId);
  if (!existing) return { error: "Product not found." };

  let slug = existing.slug;
  if (input.slug !== undefined) {
    slug = input.slug.trim().toLowerCase();
    const slugError = validateProductSlug(slug);
    if (slugError) return { error: slugError };
    if (slugTaken(slug, productId)) return { error: "This slug is already in use." };
  }

  if (input.name !== undefined && !input.name.trim()) {
    return { error: "Product name is required." };
  }
  if (input.priceCents !== undefined && (!Number.isInteger(input.priceCents) || input.priceCents < 0)) {
    return { error: "Price must be non-negative." };
  }
  if (input.stock !== undefined && (!Number.isInteger(input.stock) || input.stock < 0)) {
    return { error: "Stock must be a non-negative integer." };
  }

  const db = getDb();
  const updated = db
    .update(products)
    .set({
      slug,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined
          ? input.description.trim() || null
          : existing.description,
      priceCents: input.priceCents ?? existing.priceCents,
      stock: input.stock ?? existing.stock,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      imageUrl:
        input.imageUrl !== undefined
          ? input.imageUrl?.trim() || null
          : existing.imageUrl,
      featured: input.featured ?? existing.featured,
    })
    .where(eq(products.id, productId))
    .returning()
    .get();

  return { product: updated };
}

export function deleteProduct(productId: number): { ok: boolean; error?: string } {
  const db = getDb();
  const existing = db.select().from(products).where(eq(products.id, productId)).get();
  if (!existing) return { ok: false, error: "Product not found." };

  db.delete(products).where(eq(products.id, productId)).run();
  return { ok: true };
}

export function countProducts(): number {
  const db = getDb();
  return db.select({ id: products.id }).from(products).all().length;
}
