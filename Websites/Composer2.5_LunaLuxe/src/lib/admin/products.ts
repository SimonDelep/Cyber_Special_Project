import { db } from '@/db';
import { products, productCategories, type Product, type ProductCategory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidCategory(category: string): category is ProductCategory {
  return (productCategories as readonly string[]).includes(category);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product;
}

export async function createProduct(data: {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  featured?: boolean;
}): Promise<Product> {
  const [product] = await db
    .insert(products)
    .values({
      slug: data.slug,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      imageUrl: data.imageUrl,
      featured: data.featured ?? false,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return product;
}

export async function updateProduct(
  id: number,
  data: {
    slug?: string;
    name?: string;
    description?: string;
    price?: number;
    category?: ProductCategory;
    imageUrl?: string;
    featured?: boolean;
  }
): Promise<Product | undefined> {
  const existing = await getProductById(id);
  if (!existing) return undefined;

  const [product] = await db
    .update(products)
    .set({
      slug: data.slug ?? existing.slug,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      price: data.price ?? existing.price,
      category: data.category ?? existing.category,
      imageUrl: data.imageUrl ?? existing.imageUrl,
      featured: data.featured ?? existing.featured,
    })
    .where(eq(products.id, id))
    .returning();

  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}
