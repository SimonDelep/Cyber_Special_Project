import { createSignal, For, onMount, Show } from 'solid-js';
import { formatPrice } from '../../lib/format';
import { PRODUCT_CATEGORIES } from '../../lib/auth/product-validation';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  category: string;
  image: string;
  featured: boolean;
}

const SORT_OPTIONS = [
  { value: '', label: 'Default order' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'price-asc', label: 'Price (low to high)' },
  { value: 'price-desc', label: 'Price (high to low)' },
  { value: 'newest', label: 'Newest' },
] as const;

function categoryLabel(category: string): string {
  return category === 'doorbell-cameras' ? 'Doorbell camera' : 'Smart lighting';
}

export default function CatalogBrowser() {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [search, setSearch] = createSignal('');
  const [category, setCategory] = createSignal('');
  const [sort, setSort] = createSignal('');
  const [featuredOnly, setFeaturedOnly] = createSignal(false);
  const [minPrice, setMinPrice] = createSignal('');
  const [maxPrice, setMaxPrice] = createSignal('');

  async function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    const q = search().trim();
    if (q) params.set('q', q);
    if (category()) params.set('category', category());
    if (sort()) params.set('sort', sort());
    if (featuredOnly()) params.set('featured', 'true');
    const min = minPrice().trim();
    const max = maxPrice().trim();
    if (min) {
      const cents = Math.round(Number.parseFloat(min) * 100);
      if (!Number.isNaN(cents)) params.set('minPrice', String(cents));
    }
    if (max) {
      const cents = Math.round(Number.parseFloat(max) * 100);
      if (!Number.isNaN(cents)) params.set('maxPrice', String(cents));
    }

    try {
      const res = await fetch(`/api/catalog?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setProducts(json.products);
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
    const q = params.get('q');
    if (q) setSearch(q);
    fetchProducts();
  });

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-nest-900 px-3 py-2 text-sm text-white placeholder:text-nest-100/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30';

  return (
    <div class="space-y-8">
      <form
        class="grid gap-4 rounded-2xl border border-white/10 bg-nest-900/50 p-5 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          fetchProducts();
        }}
      >
        <label class="block space-y-1 sm:col-span-2 lg:col-span-3">
          <span class="text-sm text-nest-100/70">Search</span>
          <input
            type="search"
            class={inputClass}
            placeholder="Name, description, or slug…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </label>

        <label class="block space-y-1">
          <span class="text-sm text-nest-100/70">Category</span>
          <select
            class={inputClass}
            value={category()}
            onChange={(e) => setCategory(e.currentTarget.value)}
          >
            <option value="">All categories</option>
            <For each={[...PRODUCT_CATEGORIES]}>
              {(cat) => <option value={cat}>{categoryLabel(cat)}</option>}
            </For>
          </select>
        </label>

        <label class="block space-y-1">
          <span class="text-sm text-nest-100/70">Sort by</span>
          <select
            class={inputClass}
            value={sort()}
            onChange={(e) => setSort(e.currentTarget.value)}
          >
            <For each={SORT_OPTIONS}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </select>
        </label>

        <label class="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            checked={featuredOnly()}
            onChange={(e) => setFeaturedOnly(e.currentTarget.checked)}
            class="rounded border-white/20 bg-nest-900 text-accent"
          />
          <span class="text-sm text-nest-100/70">Featured only</span>
        </label>

        <label class="block space-y-1">
          <span class="text-sm text-nest-100/70">Min price (CAD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            class={inputClass}
            placeholder="0.00"
            value={minPrice()}
            onInput={(e) => setMinPrice(e.currentTarget.value)}
          />
        </label>

        <label class="block space-y-1">
          <span class="text-sm text-nest-100/70">Max price (CAD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            class={inputClass}
            placeholder="999.99"
            value={maxPrice()}
            onInput={(e) => setMaxPrice(e.currentTarget.value)}
          />
        </label>

        <div class="flex items-end sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            class="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-nest-950 hover:bg-accent/90"
          >
            Apply filters
          </button>
        </div>
      </form>

      <Show
        when={!loading()}
        fallback={<p class="text-center text-nest-100/60">Loading products…</p>}
      >
        <Show
          when={products().length > 0}
          fallback={
            <p class="rounded-xl border border-dashed border-white/20 p-10 text-center text-nest-100/60">
              No products match your filters.
            </p>
          }
        >
          <p class="text-sm text-nest-100/60">
            {products().length} product{products().length === 1 ? '' : 's'} found
          </p>
          <ul class="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <For each={products()}>
              {(product) => (
                <li>
                  <article class="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-nest-900/60 transition hover:border-accent/30">
                    <a href={`/products/${product.slug}`} class="block">
                      <div class="relative aspect-[4/3] bg-gradient-to-br from-nest-800 to-nest-900 p-8">
                        <img
                          src={product.image}
                          alt={product.name}
                          class="mx-auto h-full max-h-40 w-auto object-contain transition group-hover:scale-105"
                          loading="lazy"
                        />
                        <span class="absolute left-4 top-4 rounded-full bg-nest-950/80 px-2.5 py-1 text-xs text-accent backdrop-blur">
                          {categoryLabel(product.category)}
                        </span>
                        <Show when={product.featured}>
                          <span class="absolute right-4 top-4 rounded-full bg-glow/20 px-2.5 py-1 text-xs text-glow backdrop-blur">
                            Featured
                          </span>
                        </Show>
                      </div>
                    </a>
                    <div class="flex flex-1 flex-col gap-3 p-5">
                      <a href={`/products/${product.slug}`} class="block hover:text-accent">
                        <h2 class="font-display text-lg font-semibold text-white">
                          {product.name}
                        </h2>
                      </a>
                      <p class="line-clamp-2 text-sm text-nest-100/60">{product.description}</p>
                      <p class="font-display text-xl font-semibold text-accent">
                        {formatPrice(product.priceCents)}
                      </p>
                      <a
                        href={`/products/${product.slug}`}
                        class="mt-auto text-sm font-medium text-accent hover:underline"
                      >
                        View details & reviews →
                      </a>
                    </div>
                  </article>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </div>
  );
}
