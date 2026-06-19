import { Suspense } from "react";

import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import {
  getDistinctRoastLevels,
  searchProducts,
} from "@/lib/products";
import { catalogQuerySchema } from "@/lib/validations/catalog";

export const metadata = {
  title: "Product catalog | RoastRitual",
  description:
    "Browse specialty coffees and herbal teas with search and filters.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const raw = await searchParams;
  const parsed = catalogQuerySchema.safeParse({
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    roastLevel: firstParam(raw.roastLevel),
    ethical: firstParam(raw.ethical),
    minPrice: firstParam(raw.minPrice),
    maxPrice: firstParam(raw.maxPrice),
    sort: firstParam(raw.sort),
  });

  const query = parsed.success ? parsed.data : {};
  const [products, roastLevels] = await Promise.all([
    searchProducts(query),
    getDistinctRoastLevels(),
  ]);

  const defaults = {
    q: query.q ?? "",
    category: query.category ?? "ALL",
    roastLevel: query.roastLevel ?? "",
    ethical: query.ethical ?? "",
    minPrice: query.minPrice !== undefined ? String(query.minPrice) : "",
    maxPrice: query.maxPrice !== undefined ? String(query.maxPrice) : "",
    sort: query.sort ?? "name",
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-espresso md:text-4xl">
        Product catalog
      </h1>
      <p className="mt-2 max-w-2xl text-espresso/70">
        Search and filter our ethically sourced coffees and herbal teas. Open a
        product to read reviews or share your own.
      </p>

      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-espresso/60">Loading filters…</p>}>
          <CatalogFilters roastLevels={roastLevels} defaults={defaults} />
        </Suspense>
      </div>

      <p className="mt-8 text-sm text-espresso/60">
        {products.length} product{products.length !== 1 ? "s" : ""} found
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-sage/25 bg-linen p-10 text-center">
          <p className="font-display text-xl text-espresso">No matches</p>
          <p className="mt-2 text-sm text-espresso/70">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}
