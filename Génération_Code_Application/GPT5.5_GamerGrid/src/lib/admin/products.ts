import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { categories, products } from '@/db/schema';
import type { ProductDTO } from '@/lib/types';

export interface ProductInput {
  categoryId: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  image: string;
  badge?: string | null;
  featured?: boolean;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateProductInput(input: ProductInput, isUpdate = false): ProductInput {
  if (!isUpdate) {
    if (!input.categoryId?.trim()) throw new Error('Category is required.');
    if (!input.name?.trim()) throw new Error('Product name is required.');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('Product name cannot be empty.');
  }
  if (input.price !== undefined && (typeof input.price !== 'number' || input.price < 0)) {
    throw new Error('Price must be a non-negative number.');
  }
  if (input.description !== undefined && !input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (input.image !== undefined && !input.image.trim()) {
    throw new Error('Image path or URL is required.');
  }
  return input;
}

export async function listAllProducts(): Promise<ProductDTO[]> {
  const db = getDb();
  return db
    .select({
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
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));
}

export async function listCategories() {
  const db = getDb();
  return db.select().from(categories);
}

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  validateProductInput(input);
  const db = getDb();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);
  if (!category) throw new Error('Category not found.');

  const slug = input.slug?.trim() || slugify(input.name);
  const [slugTaken] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (slugTaken) throw new Error('Product slug is already in use.');

  const id = nanoid();
  await db.insert(products).values({
    id,
    categoryId: input.categoryId,
    name: input.name.trim(),
    slug,
    description: input.description.trim(),
    price: Math.round(input.price * 100) / 100,
    image: input.image.trim(),
    badge: input.badge?.trim() || null,
    featured: input.featured ?? false,
  });

  const all = await listAllProducts();
  const created = all.find((p) => p.id === id);
  if (!created) throw new Error('Failed to create product.');
  return created;
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
): Promise<ProductDTO> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!existing) throw new Error('Product not found.');

  validateProductInput(input as ProductInput, true);

  const updates: Partial<typeof products.$inferInsert> = {};

  if (input.categoryId !== undefined) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);
    if (!category) throw new Error('Category not found.');
    updates.categoryId = input.categoryId;
  }

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.price !== undefined) {
    updates.price = Math.round(input.price * 100) / 100;
  }
  if (input.image !== undefined) updates.image = input.image.trim();
  if (input.badge !== undefined) updates.badge = input.badge?.trim() || null;
  if (input.featured !== undefined) updates.featured = input.featured;

  if (input.slug !== undefined) {
    const slug = input.slug.trim() || slugify(input.name ?? existing.name);
    const [slugTaken] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (slugTaken && slugTaken.id !== productId) {
      throw new Error('Product slug is already in use.');
    }
    updates.slug = slug;
  } else if (input.name !== undefined) {
    const slug = slugify(input.name);
    const [slugTaken] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (slugTaken && slugTaken.id !== productId) {
      updates.slug = `${slug}-${productId.slice(0, 6)}`;
    } else {
      updates.slug = slug;
    }
  }

  await db.update(products).set(updates).where(eq(products.id, productId));

  const all = await listAllProducts();
  const updated = all.find((p) => p.id === productId);
  if (!updated) throw new Error('Failed to update product.');
  return updated;
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!existing) throw new Error('Product not found.');
  await db.delete(products).where(eq(products.id, productId));
}
