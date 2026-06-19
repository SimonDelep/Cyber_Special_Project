import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogOpenInsight } from "@/components/products/CatalogOpenInsight";
import {
  CatalogProductCard,
  type CatalogProduct,
} from "@/components/catalog/CatalogProductCard";
import {
  averageRating,
  buildCatalogOrderBy,
  buildCatalogWhere,
  catalogParamsFromSearchParams,
} from "@/lib/catalog/query";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse EverThread Co essentials with search and filters.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = catalogParamsFromSearchParams(await searchParams);
  const where = buildCatalogWhere(params);
  const orderBy = buildCatalogOrderBy(params.sort);

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
    }),
  ]);

  const catalogProducts: CatalogProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    inStock: p.inStock,
    featured: p.featured,
    category: p.category,
    averageRating: averageRating(p.reviews),
    reviewCount: p.reviews.length,
  }));

  const current = {
    q: params.q ?? "",
    category: params.category ?? "all",
    minPrice: params.minPrice ?? "",
    maxPrice: params.maxPrice ?? "",
    inStock: params.inStock ?? "all",
    featured: params.featured ?? "",
    sort: params.sort ?? "newest",
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
        Shop
      </p>
      <h1 className="mt-3 font-display text-4xl text-sand-900 md:text-5xl">
        Product catalog
      </h1>
      <p className="mt-3 max-w-2xl text-sand-600">
        Search and filter our full collection of organic Egyptian cotton and
        recycled-fiber essentials.
      </p>

      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-sand-500">Loading filters…</p>}>
          <CatalogFilters categories={categories} current={current} />
        </Suspense>
      </div>

      <p className="mt-8 text-sm text-sand-600">
        {catalogProducts.length} product
        {catalogProducts.length !== 1 ? "s" : ""} found
      </p>

      {catalogProducts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-sand-300 bg-cream-50 p-12 text-center text-sand-600">
          No products match your filters. Try adjusting search or filters.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalogProducts.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}

      <CatalogOpenInsight />
    </div>
  );
}
