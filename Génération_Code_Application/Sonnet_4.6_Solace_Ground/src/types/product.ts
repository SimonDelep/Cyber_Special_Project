import type { Product } from '@/db/schema';

export type PublicProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  createdAt: string;
};

export function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    inStock: p.inStock,
    createdAt: p.createdAt,
  };
}
