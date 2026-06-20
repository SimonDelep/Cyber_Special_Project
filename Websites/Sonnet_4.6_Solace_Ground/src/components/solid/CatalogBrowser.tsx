import { createSignal, createEffect, Show, For } from 'solid-js';
import type { CatalogProduct } from '@/types/review';
import { formatPrice } from '@/lib/utils';
import StarRating from './StarRating';

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-3 py-2 text-sm text-cork-900 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

export default function CatalogBrowser() {
  const [q, setQ] = createSignal('');
  const [category, setCategory] = createSignal('all');
  const [inStockOnly, setInStockOnly] = createSignal(false);
  const [minPrice, setMinPrice] = createSignal('');
  const [maxPrice, setMaxPrice] = createSignal('');
  const [minRating, setMinRating] = createSignal('');
  const [products, setProducts] = createSignal<CatalogProduct[]>([]);
  const [loading, setLoading] = createSignal(true);

  async function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q().trim()) params.set('q', q().trim());
    if (category() !== 'all') params.set('category', category());
    if (inStockOnly()) params.set('inStock', 'true');
    if (minPrice()) params.set('minPrice', minPrice());
    if (maxPrice()) params.set('maxPrice', maxPrice());
    if (minRating()) params.set('minRating', minRating());

    try {
      const res = await fetch(`/api/catalog/products?${params}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    q();
    category();
    inStockOnly();
    minPrice();
    maxPrice();
    minRating();
    fetchProducts();
  });

  const categoryLabel = (c: string) =>
    c === 'yoga-mat' ? 'Yoga mat' : 'Meditation cushion';

  return (
    <div class="space-y-8">
      <form
        class="rounded-2xl border border-cork-200 bg-cork-50/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          fetchProducts();
        }}
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="sm:col-span-2 lg:col-span-3">
            <label for="search" class="text-xs font-medium text-cork-700">
              Search
            </label>
            <input
              id="search"
              type="search"
              placeholder="Search by name or description…"
              class={inputClass}
              value={q()}
              onInput={(e) => setQ(e.currentTarget.value)}
            />
          </div>
          <div>
            <label for="category" class="text-xs font-medium text-cork-700">
              Category
            </label>
            <select
              id="category"
              class={inputClass}
              value={category()}
              onChange={(e) => setCategory(e.currentTarget.value)}
            >
              <option value="all">All categories</option>
              <option value="yoga-mat">Yoga mats</option>
              <option value="cushion">Meditation cushions</option>
            </select>
          </div>
          <div>
            <label for="minRating" class="text-xs font-medium text-cork-700">
              Min. rating
            </label>
            <select
              id="minRating"
              class={inputClass}
              value={minRating()}
              onChange={(e) => setMinRating(e.currentTarget.value)}
            >
              <option value="">Any</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>
          <div>
            <label for="minPrice" class="text-xs font-medium text-cork-700">
              Min price (USD)
            </label>
            <input
              id="minPrice"
              type="number"
              min="0"
              step="0.01"
              class={inputClass}
              value={minPrice()}
              onInput={(e) => setMinPrice(e.currentTarget.value)}
            />
          </div>
          <div>
            <label for="maxPrice" class="text-xs font-medium text-cork-700">
              Max price (USD)
            </label>
            <input
              id="maxPrice"
              type="number"
              min="0"
              step="0.01"
              class={inputClass}
              value={maxPrice()}
              onInput={(e) => setMaxPrice(e.currentTarget.value)}
            />
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 pb-2 text-sm text-cork-800">
              <input
                type="checkbox"
                checked={inStockOnly()}
                onChange={(e) => setInStockOnly(e.currentTarget.checked)}
              />
              In stock only
            </label>
          </div>
        </div>
      </form>

      <Show when={loading()}>
        <p class="text-sm text-cork-500">Loading products…</p>
      </Show>

      <Show when={!loading() && products().length === 0}>
        <p class="rounded-2xl border border-dashed border-cork-300 px-6 py-12 text-center text-cork-600">
          No products match your filters.
        </p>
      </Show>

      <Show when={!loading() && products().length > 0}>
        <p class="text-sm text-cork-600">
          {products().length} product{products().length === 1 ? '' : 's'} found
        </p>
        <ul class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <For each={products()}>
            {(product) => (
              <li>
                <a
                  href={`/products/${product.slug}`}
                  class="group flex h-full flex-col overflow-hidden rounded-2xl border border-cork-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div class="relative aspect-[4/3] overflow-hidden bg-cork-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        class="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div class="flex h-full items-center justify-center font-serif text-3xl text-cork-400">
                        {product.category === 'yoga-mat' ? 'Mat' : 'Cushion'}
                      </div>
                    )}
                    {!product.inStock && (
                      <span class="absolute right-3 top-3 rounded-full bg-cork-800/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div class="flex flex-1 flex-col p-5">
                    <p class="text-xs uppercase tracking-wider text-sage-600">
                      {categoryLabel(product.category)}
                    </p>
                    <h3 class="mt-1 font-serif text-lg text-cork-900 group-hover:text-cork-700">
                      {product.name}
                    </h3>
                    <p class="mt-2 line-clamp-2 text-sm text-cork-600">{product.description}</p>
                    <div class="mt-3 flex items-center gap-2 text-sm text-cork-600">
                      {product.averageRating !== null ? (
                        <>
                          <StarRating value={product.averageRating} size="sm" />
                          <span>
                            ({product.reviewCount} review{product.reviewCount === 1 ? '' : 's'})
                          </span>
                        </>
                      ) : (
                        <span class="text-cork-500">No reviews yet</span>
                      )}
                    </div>
                    <p class="mt-3 font-semibold text-cork-900">{formatPrice(product.priceCents)}</p>
                  </div>
                </a>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
