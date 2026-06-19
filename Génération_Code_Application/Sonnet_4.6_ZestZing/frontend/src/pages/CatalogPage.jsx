import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  categoryAccent,
  categoryLabel,
  formatMoney,
  PRODUCT_CATEGORIES,
} from "../api/client";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const defaultFilters = {
  search: "",
  category: "",
  min_price: "",
  max_price: "",
  sort: "name",
};

export default function CatalogPage() {
  const { addItem } = useCart();
  const [filters, setFilters] = useState(defaultFilters);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError("");
    const params = { sort: filters.sort };
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.category) params.category = filters.category;
    if (filters.min_price !== "") params.min_price = filters.min_price;
    if (filters.max_price !== "") params.max_price = filters.max_price;

    api
      .getProducts(params)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const clearFilters = () => setFilters(defaultFilters);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-stone-900">Product Catalog</h1>
        <p className="mt-2 text-stone-600">
          Search and filter our small-batch collection.
        </p>

        <aside className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-stone-700">Search</label>
              <input
                type="search"
                placeholder="Name, description…"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Min price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={filters.min_price}
                onChange={(e) => updateFilter("min_price", e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Max price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={filters.max_price}
                onChange={(e) => updateFilter("max_price", e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Sort by</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-stone-600 hover:text-brand-600"
          >
            Clear filters
          </button>
        </aside>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
        )}

        <p className="mt-6 text-sm text-stone-500">
          {loading ? "Searching…" : `${products.length} product${products.length === 1 ? "" : "s"} found`}
        </p>

        {!loading && products.length === 0 && !error && (
          <p className="mt-8 text-center text-stone-600">No products match your filters.</p>
        )}

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-brand-200 transition-all"
            >
              <Link to={`/products/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-br ${categoryAccent(product.category)} opacity-80`}
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {categoryLabel(product.category)}
                </span>
                <Link to={`/products/${product.id}`}>
                  <h2 className="mt-1 font-display text-xl font-bold text-stone-900 hover:text-brand-700">
                    {product.name}
                  </h2>
                </Link>
                <p className="mt-2 text-stone-600 text-sm leading-relaxed line-clamp-2 flex-1">
                  {product.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-brand-700">
                    {formatMoney(product.price)}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50"
                    >
                      Reviews
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        addItem(product);
                        setAddedId(product.id);
                        setTimeout(() => setAddedId(null), 2000);
                      }}
                      className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      {addedId === product.id ? "Added ✓" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
