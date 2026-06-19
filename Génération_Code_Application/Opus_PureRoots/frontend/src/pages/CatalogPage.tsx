import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, fetchCatalog, type CatalogFilters } from "../api/products";
import ProductCard from "../components/ProductCard";
import type { Product } from "../types/product";

const inputClass =
  "rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<CatalogFilters["sort"]>("name");

  const load = useCallback(async (filters: CatalogFilters) => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchCatalog(filters));
    } catch {
      setError("Could not load products. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({});
  }, [load]);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    load({
      search,
      category: category || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      sort,
    });
  }

  function handleReset() {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("name");
    load({});
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-sage-500">Catalog</p>
          <h1 className="font-display mt-1 text-3xl font-semibold text-forest-800 md:text-4xl">
            Product catalog
          </h1>
          <p className="mt-2 text-stone-600">
            Search and filter our sustainable essentials. Click a product for details and reviews.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-forest-600 hover:text-forest-700"
        >
          ← Back to home
        </Link>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-forest-200/80 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-6"
      >
        <label className="lg:col-span-2">
          <span className="block text-xs font-medium text-stone-600">Search</span>
          <input
            type="search"
            placeholder="Name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputClass} mt-1 w-full`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Min price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Max price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogFilters["sort"])}
            className={`${inputClass} mt-1 w-full`}
          >
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
        <div className="flex items-end gap-2 lg:col-span-6">
          <button
            type="submit"
            className="rounded-full bg-forest-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-forest-200 px-5 py-2.5 text-sm font-medium text-forest-700 hover:bg-forest-50"
          >
            Reset
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"} found`}
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="mt-12 text-center text-stone-600">No products match your filters.</p>
      )}

      {!loading && products.length > 0 && (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link to={`/products/${product.slug}`} className="block">
                <ProductCard product={product} linkable />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
