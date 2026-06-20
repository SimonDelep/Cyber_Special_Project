import { createSignal, For, Show, onMount } from "solid-js";
import type { Product } from "@/db/schema";
import { PRODUCT_CATEGORIES } from "@/lib/products/validate";
import { formatPrice } from "@/lib/format";
import { addToCart } from "@/stores/cart";

type Filters = {
  q: string;
  category: string;
  featured: string;
  stackable: string;
  leakProof: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const defaultFilters = (): Filters => ({
  q: "",
  category: "",
  featured: "",
  stackable: "",
  leakProof: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
});

function buildQuery(f: Filters): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.category) params.set("category", f.category);
  if (f.featured) params.set("featured", f.featured);
  if (f.stackable) params.set("stackable", f.stackable);
  if (f.leakProof) params.set("leakProof", f.leakProof);
  if (f.minPrice) params.set("minPrice", f.minPrice);
  if (f.maxPrice) params.set("maxPrice", f.maxPrice);
  if (f.sort) params.set("sort", f.sort);
  return params.toString();
}

export default function CatalogPage() {
  const [filters, setFilters] = createSignal<Filters>(defaultFilters());
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(true);

  async function fetchProducts(f: Filters) {
    setLoading(true);
    try {
      const qs = buildQuery(f);
      const res = await fetch(`/api/catalog${qs ? `?${qs}` : ""}`);
      const json = await res.json();
      setProducts(json.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const f: Filters = {
      q: params.get("q") ?? "",
      category: params.get("category") ?? "",
      featured: params.get("featured") ?? "",
      stackable: params.get("stackable") ?? "",
      leakProof: params.get("leakProof") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      sort: params.get("sort") ?? "newest",
    };
    setFilters(f);
    fetchProducts(f);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const f = filters();
    const qs = buildQuery(f);
    const url = qs ? `/catalog?${qs}` : "/catalog";
    window.history.replaceState({}, "", url);
    fetchProducts(f);
  }

  function resetFilters() {
    const f = defaultFilters();
    setFilters(f);
    window.history.replaceState({}, "", "/catalog");
    fetchProducts(f);
  }

  function setField<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  onMount(applyFromUrl);

  return (
    <div>
      <h1 class="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Product catalog
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Search and filter our glass meal prep and bento collection. Open any
        product to read reviews or share your own.
      </p>

      <form
        class="mt-8 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="sm:col-span-2 lg:col-span-2">
            <label class="block text-sm font-medium text-ink" for="search">
              Search
            </label>
            <input
              id="search"
              type="search"
              placeholder="Name or description…"
              value={filters().q}
              onInput={(e) => setField("q", e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink" for="category">
              Category
            </label>
            <select
              id="category"
              value={filters().category}
              onChange={(e) => setField("category", e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              <For each={[...PRODUCT_CATEGORIES]}>
                {(c) => <option value={c}>{c.replace("-", " ")}</option>}
              </For>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink" for="sort">
              Sort by
            </label>
            <select
              id="sort"
              value={filters().sort}
              onChange={(e) => setField("sort", e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink" for="minPrice">
              Min price (CAD)
            </label>
            <input
              id="minPrice"
              type="number"
              min="0"
              step="0.01"
              value={filters().minPrice}
              onInput={(e) => setField("minPrice", e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink" for="maxPrice">
              Max price (CAD)
            </label>
            <input
              id="maxPrice"
              type="number"
              min="0"
              step="0.01"
              value={filters().maxPrice}
              onInput={(e) => setField("maxPrice", e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
          </div>
          <div class="flex flex-wrap items-end gap-4 sm:col-span-2">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters().featured === "true"}
                onChange={(e) =>
                  setField("featured", e.currentTarget.checked ? "true" : "")
                }
              />
              Featured only
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters().stackable === "true"}
                onChange={(e) =>
                  setField("stackable", e.currentTarget.checked ? "true" : "")
                }
              />
              Stackable
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters().leakProof === "true"}
                onChange={(e) =>
                  setField("leakProof", e.currentTarget.checked ? "true" : "")
                }
              />
              Leak-proof
            </label>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            class="rounded-full border border-brand-200 px-5 py-2 text-sm font-medium text-muted hover:bg-brand-50"
          >
            Reset
          </button>
        </div>
      </form>

      <p class="mt-6 text-sm text-muted">
        {loading() ? "Loading…" : `${products().length} product(s) found`}
      </p>

      <Show
        when={!loading() && products().length > 0}
        fallback={
          <Show when={!loading()}>
            <p class="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-10 text-center text-muted">
              No products match your filters.
            </p>
          </Show>
        }
      >
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <For each={products()}>
            {(product) => (
              <article class="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md">
                <a href={`/products/${product.slug}`} class="block">
                  <div class="aspect-square bg-gradient-to-br from-brand-50 to-white p-6">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      class="h-full w-full object-contain"
                      width={320}
                      height={320}
                      loading="lazy"
                    />
                  </div>
                </a>
                <div class="flex flex-1 flex-col p-5">
                  <a
                    href={`/products/${product.slug}`}
                    class="font-semibold text-ink hover:text-brand-700"
                  >
                    {product.name}
                  </a>
                  <p class="mt-2 flex-1 text-sm text-muted line-clamp-2">
                    {product.description}
                  </p>
                  <div class="mt-4 flex items-center justify-between gap-2">
                    <span class="font-semibold text-brand-800">
                      {formatPrice(product.priceCents)}
                    </span>
                    <div class="flex gap-2">
                      <a
                        href={`/products/${product.slug}`}
                        class="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-50"
                      >
                        Details
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            priceCents: product.priceCents,
                          })
                        }
                        class="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
