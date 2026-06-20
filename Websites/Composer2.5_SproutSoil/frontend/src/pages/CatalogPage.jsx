import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatMoney, productApi } from "../api/client";
import { useCart } from "../context/CartContext";
import StarRating from "../components/StarRating";

const CATEGORY_LABELS = {
  "herb-garden-kits": "Herb Garden Kits",
  planters: "Planters",
  "nutrient-mists": "Nutrient Mists",
};

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default function CatalogPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("name");

  const loadProducts = useCallback(() => {
    setLoading(true);
    productApi
      .list({
        search: search || undefined,
        category: category || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        sort,
      })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, category, minPrice, maxPrice, sort]);

  useEffect(() => {
    productApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-soil-950">
          Product catalog
        </h1>
        <p className="mt-2 text-soil-600">
          Browse our full collection of smart gardens, planters, and nutrient mists.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-soil-200 bg-soil-50 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-soil-600 mb-1">
              Search
            </label>
            <input
              id="search"
              type="search"
              placeholder="Search by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-xs font-medium text-soil-600 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-xs font-medium text-soil-600 mb-1">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="min-price" className="block text-xs font-medium text-soil-600 mb-1">
                Min $
              </label>
              <input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="max-price" className="block text-xs font-medium text-soil-600 mb-1">
                Max $
              </label>
              <input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-soil-500">
        {loading ? "Searching…" : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
      </p>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-soil-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-soil-500">No products match your filters.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/catalog/${product.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-soil-200 bg-white transition-all hover:border-sprout-400/50 hover:shadow-lg"
            >
              <div className="h-44 overflow-hidden bg-soil-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-4xl">🌿</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-sprout-600">
                  {CATEGORY_LABELS[product.category] ?? product.category}
                </span>
                <h2 className="mt-1 font-display text-lg font-bold text-soil-900 group-hover:text-sprout-600">
                  {product.name}
                </h2>
                {product.average_rating != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <StarRating value={Math.round(product.average_rating)} readonly size="sm" />
                    <span className="text-xs text-soil-500">
                      {product.average_rating} ({product.review_count})
                    </span>
                  </div>
                )}
                <p className="mt-2 flex-1 text-sm text-soil-600 line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xl font-bold text-soil-900">
                    {formatMoney(product.price)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(product, e)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium text-white ${
                      addedId === product.id ? "bg-sprout-500" : "bg-soil-800 hover:bg-sprout-600"
                    }`}
                  >
                    {addedId === product.id ? "Added!" : "Add to cart"}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
