import { prisma } from "@/lib/prisma";
import { categoryAccents, categoryLabels } from "@/lib/product-constants";
import { decimalToNumber } from "@/lib/utils";
import type { ProductItem } from "@/types";

export { categoryAccents, categoryLabels };

function serializeProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: { toString(): string };
  category: ProductItem["category"];
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
}): ProductItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: decimalToNumber(product.price),
    category: product.category,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    featured: product.featured,
  };
}

export async function getLandingProducts(): Promise<ProductItem[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: 12,
  });

  return products.map(serializeProduct);
}

export async function getAllProducts(): Promise<ProductItem[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });

  return products.map(serializeProduct);
}

