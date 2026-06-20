import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  buildProductOrderBy,
  buildProductWhere,
  parseProductFilters,
} from "@/lib/products/query";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductCard, type CatalogProduct } from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Product catalog",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters.sort);

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  const catalog: CatalogProduct[] = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
          ) / 10
        : null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      category: p.category,
      featured: p.featured,
      inStock: p.inStock,
      reviewCount: p._count.reviews,
      avgRating,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Product catalog
        </h1>
        <p className="mt-2 text-muted">
          Search and filter our full collection of travel tech.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-border/30" />}>
            <ProductFilters />
          </Suspense>
        </aside>

        <div>
          <p className="mb-6 text-sm text-muted">
            {catalog.length} {catalog.length === 1 ? "product" : "products"} found
          </p>
          {catalog.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="font-medium">No products match your filters</p>
              <p className="mt-2 text-sm text-muted">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
