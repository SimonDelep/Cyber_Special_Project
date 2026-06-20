import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductCatalogFilters from "../components/ProductCatalogFilters";
import { fetchProducts } from "../api/products";
import type { Product } from "../types/product";
import { defaultCatalogFilters, type CatalogFilters } from "../types/catalog";

function dollarsToCents(value: string): number | undefined {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params: Parameters<typeof fetchProducts>[0] = {
      sort: filters.sort,
    };
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.category !== "all") params.category = filters.category;
    const min = dollarsToCents(filters.minPrice);
    const max = dollarsToCents(filters.maxPrice);
    if (min !== undefined) params.min_price_cents = min;
    if (max !== undefined) params.max_price_cents = max;
    return params;
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      fetchProducts(queryParams)
        .then(setProducts)
        .catch(() => setError("Could not load products. Is the API running?"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [queryParams]);

  return (
    <section className="border-t border-grid-border bg-grid-surface/20 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-grid-cyan">Product catalog</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">
            Find your next upgrade
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-grid-muted">
            Search and filter keyboards, mice, and RGB desk mats by category, price, and name.
          </p>
        </div>

        <div className="mt-10">
          <ProductCatalogFilters filters={filters} onChange={setFilters} />
        </div>

        {loading && <p className="mt-16 text-center text-grid-muted">Loading catalog…</p>}
        {error && <p className="mt-16 text-center text-amber-400">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="mt-16 text-center text-grid-muted">No products match your filters.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="mt-8 text-center text-sm text-grid-muted">
              {products.length} product{products.length !== 1 ? "s" : ""} found
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
