import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { Product, ProductSort } from "../types/product";

function formatCategory(category: string) {
  return category.replace(/-/g, " ");
}

function StarRating({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-xs text-mist/40">No reviews</span>;
  return (
    <span className="text-xs text-gold">
      {"★".repeat(Math.round(value))}
      <span className="text-mist/40">{"★".repeat(5 - Math.round(value))}</span>
      <span className="ml-1 text-mist/50">({value.toFixed(1)})</span>
    </span>
  );
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addProduct } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const sort = (searchParams.get("sort") as ProductSort) || "name";

  const [searchInput, setSearchInput] = useState(q);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await api.searchProducts({
        q: q || undefined,
        category: category || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort,
      });
      setProducts(items);
    } catch {
      setError("Could not load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, sort]);

  useEffect(() => {
    api.getProductCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setSearchInput(q);
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }, [q, minPrice, maxPrice]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set("q", searchInput.trim());
    if (category) next.set("category", category);
    if (minInput) next.set("min_price", minInput);
    if (maxInput) next.set("max_price", maxInput);
    if (sort && sort !== "name") next.set("sort", sort);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    setSearchParams({});
  }

  function handleAddToCart(product: Product) {
    if (!user) {
      navigate("/login");
      return;
    }
    addProduct(product);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <h1 className="font-display text-4xl text-mist">Product catalog</h1>
        <p className="mt-2 text-mist/60">
          Search and filter our print-on-demand collection.
        </p>

        <form
          onSubmit={applyFilters}
          className="mt-8 grid gap-4 rounded-sm border border-white/5 bg-deep/50 p-6 md:grid-cols-2 lg:grid-cols-6"
        >
          <div className="lg:col-span-2">
            <label htmlFor="search" className="text-xs uppercase tracking-wider text-fog">
              Search
            </label>
            <input
              id="search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or description…"
              className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="category" className="text-xs uppercase tracking-wider text-fog">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set("category", e.target.value);
                else next.delete("category");
                setSearchParams(next);
              }}
              className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="min_price" className="text-xs uppercase tracking-wider text-fog">
              Min price
            </label>
            <input
              id="min_price"
              type="number"
              min={0}
              step="0.01"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="max_price" className="text-xs uppercase tracking-wider text-fog">
              Max price
            </label>
            <input
              id="max_price"
              type="number"
              min={0}
              step="0.01"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="sort" className="text-xs uppercase tracking-wider text-fog">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                const v = e.target.value as ProductSort;
                if (v !== "name") next.set("sort", v);
                else next.delete("sort");
                setSearchParams(next);
              }}
              className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
            >
              <option value="name">Name</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-sm bg-gold px-6 py-2 text-sm font-medium text-ink transition hover:bg-gold/90"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-sm border border-mist/30 px-4 py-2 text-sm transition hover:border-mist/60"
            >
              Clear
            </button>
          </div>
        </form>

        {error && <p className="mt-6 text-sm text-red-300">{error}</p>}

        {loading ? (
          <p className="mt-12 text-center text-mist/50">Loading catalog…</p>
        ) : products.length === 0 ? (
          <p className="mt-12 text-center text-mist/50">No products match your filters.</p>
        ) : (
          <p className="mt-6 text-sm text-mist/50">
            {products.length} product{products.length === 1 ? "" : "s"} found
          </p>
        )}

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-sm border border-white/5 bg-ink transition hover:border-gold/30"
            >
              <Link to={`/catalog/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-ink">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-mist/30">
                    No image
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 text-xs uppercase tracking-wider text-fog backdrop-blur-sm">
                  {formatCategory(product.category)}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <Link
                  to={`/catalog/${product.slug}`}
                  className="font-display text-xl text-gold transition hover:text-mist"
                >
                  {product.name}
                </Link>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StarRating value={product.average_rating} />
                  {product.review_count != null && product.review_count > 0 && (
                    <span className="text-xs text-mist/40">
                      {product.review_count} review{product.review_count === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist/60 line-clamp-2">
                  {product.description}
                </p>
                <p className="mt-4 text-lg font-medium text-gold">
                  ${Number(product.price).toFixed(2)}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 rounded-sm border border-gold/40 px-3 py-2 text-sm transition hover:border-gold hover:bg-gold/10"
                  >
                    {addedId === product.id ? "Added" : "Add to cart"}
                  </button>
                  <Link
                    to={`/catalog/${product.slug}`}
                    className="rounded-sm border border-white/10 px-3 py-2 text-sm transition hover:border-mist/40"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
