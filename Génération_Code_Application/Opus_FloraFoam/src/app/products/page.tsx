import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductCatalogCard, type CatalogProduct } from "@/components/catalog/ProductCatalogCard";
import {
  averageRating,
  buildProductOrderBy,
  buildProductWhere,
  parseCatalogParams,
  type CatalogSearchParams,
} from "@/lib/products/catalog-query";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Product catalog | FloraFoam",
  description: "Browse and filter FloraFoam plant-based skincare products.",
};

type PageProps = {
  searchParams: Promise<CatalogSearchParams>;
};

export default async function ProductsCatalogPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseCatalogParams(rawParams);

  let products: CatalogProduct[] = [];

  try {
    const rows = await prisma.product.findMany({
      where: buildProductWhere(filters),
      orderBy: buildProductOrderBy(filters.sort),
      include: {
        reviews: { select: { rating: true } },
      },
    });

    products = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      inStock: p.inStock,
      reviewCount: p.reviews.length,
      averageRating: averageRating(p.reviews),
    }));
  } catch {
    // Database unavailable
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <Link href="/" className="text-sm font-medium text-sage-700 hover:text-sage-900">
          ← Home
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold text-sage-900">Product catalog</h1>
        <p className="mt-2 max-w-2xl text-sage-600">
          Search and filter our full collection of serums, night creams, and eye patches.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CatalogFilters params={rawParams} />
        </aside>

        <div>
          <p className="mb-6 text-sm text-sage-600">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>

          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sage-200 p-12 text-center text-sage-600">
              No products match your filters. Try adjusting your search.
            </p>
          ) : (
            <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCatalogCard key={product.id} product={product} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
