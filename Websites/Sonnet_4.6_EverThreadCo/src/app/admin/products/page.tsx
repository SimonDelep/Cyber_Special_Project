import type { Metadata } from "next";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage products",
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return <ProductsManager products={products} categories={categories} />;
}
