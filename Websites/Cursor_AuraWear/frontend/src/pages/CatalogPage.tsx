import { useCallback, useEffect, useState } from "react";
import { fetchProductCategories, fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import type { Product, ProductFilters, ProductSort } from "../types/product";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
];

const emptyFilters: ProductFilters = { sort: "newest" };

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(emptyFilters);

  useEffect(() => {
    fetchProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = useCallback((activeFilters: ProductFilters) => {
    setLoading(true);
    setError("");
    fetchProducts(activeFilters)
      .then(setProducts)
      .catch(() => setError("Could not load products. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProducts(appliedFilters);
  }, [appliedFilters, loadProducts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, q: searchInput.trim() || undefined }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function updateFilter<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) {
    const next = { ...appliedFilters, [key]: value || undefined };
    setFilters(next);
    setAppliedFilters(next);
  }

  function clearFilters() {
    setSearchInput("");
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const hasActiveFilters =
    Boolean(appliedFilters.q) ||
    Boolean(appliedFilters.category) ||
    Boolean(appliedFilters.min_price) ||
    Boolean(appliedFilters.max_price) ||
    appliedFilters.sort !== "newest";

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-aura-950 sm:text-4xl">
            Product catalog
          </h1>
          <p className="mt-2 max-w-2xl text-aura-600">
            Search and filter our collection. Open a product to read reviews or share your own.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-aura-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2 lg:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-aura-600">
                Search
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or description…"
                className="w-full rounded-lg border border-aura-200 px-3 py-2.5 text-sm text-aura-950 outline-none ring-aura-400 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-aura-600">
                Category
              </span>
              <select
                value={filters.category ?? ""}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full rounded-lg border border-aura-200 px-3 py-2.5 text-sm text-aura-950 outline-none ring-aura-400 focus:ring-2"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-aura-600">
                Sort by
              </span>
              <select
                value={filters.sort ?? "newest"}
                onChange={(e) => updateFilter("sort", e.target.value as ProductSort)}
                className="w-full rounded-lg border border-aura-200 px-3 py-2.5 text-sm text-aura-950 outline-none ring-aura-400 focus:ring-2"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-aura-600">
                Min price ($)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.min_price ?? ""}
                onChange={(e) => updateFilter("min_price", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-aura-200 px-3 py-2.5 text-sm text-aura-950 outline-none ring-aura-400 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-aura-600">
                Max price ($)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.max_price ?? ""}
                onChange={(e) => updateFilter("max_price", e.target.value)}
                placeholder="Any"
                className="w-full rounded-lg border border-aura-200 px-3 py-2.5 text-sm text-aura-950 outline-none ring-aura-400 focus:ring-2"
              />
            </label>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-aura-700 hover:text-aura-950"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-[4/5] animate-pulse rounded-2xl bg-aura-200/60" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="rounded-lg border border-aura-200 bg-aura-50 px-4 py-8 text-center text-sm text-aura-600">
            No products match your filters.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-6 text-sm text-aura-600">
              {products.length} product{products.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
