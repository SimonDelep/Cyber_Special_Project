import { createMemo, createSignal, Show } from 'solid-js';
import type { CategoryDTO, ProductDTO } from '@/lib/types';

interface Props {
  products: ProductDTO[];
  categories: CategoryDTO[];
  priceMin: number;
  priceMax: number;
}

export default function CatalogBrowser(props: Props) {
  const [search, setSearch] = createSignal('');
  const [category, setCategory] = createSignal('');
  const [minPrice, setMinPrice] = createSignal(String(props.priceMin));
  const [maxPrice, setMaxPrice] = createSignal(String(props.priceMax));
  const [featuredOnly, setFeaturedOnly] = createSignal(false);

  const filtered = createMemo(() => {
    const term = search().trim().toLowerCase();
    const min = Number(minPrice());
    const max = Number(maxPrice());
    const cat = category();

    return props.products.filter((p) => {
      if (featuredOnly() && !p.featured) return false;
      if (cat && p.categorySlug !== cat) return false;
      if (!Number.isNaN(min) && p.price < min) return false;
      if (!Number.isNaN(max) && p.price > max) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term)
      );
    });
  });

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice(String(props.priceMin));
    setMaxPrice(String(props.priceMax));
    setFeaturedOnly(false);
  };

  return (
    <div class="space-y-8">
      <form
        class="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="sm:col-span-2 lg:col-span-2">
            <label for="search" class="mb-1.5 block text-xs font-medium text-slate-400">
              Search
            </label>
            <input
              id="search"
              type="search"
              placeholder="Name, description, category…"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            />
          </div>
          <div>
            <label for="category" class="mb-1.5 block text-xs font-medium text-slate-400">
              Category
            </label>
            <select
              id="category"
              value={category()}
              onChange={(e) => setCategory(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            >
              <option value="">All categories</option>
              {props.categories.map((cat) => (
                <option value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div class="flex items-end">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={featuredOnly()}
                onChange={(e) => setFeaturedOnly(e.currentTarget.checked)}
                class="rounded border-white/20"
              />
              Featured only
            </label>
          </div>
          <div>
            <label for="minPrice" class="mb-1.5 block text-xs font-medium text-slate-400">
              Min price ($)
            </label>
            <input
              id="minPrice"
              type="number"
              min={0}
              step="0.01"
              value={minPrice()}
              onInput={(e) => setMinPrice(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            />
          </div>
          <div>
            <label for="maxPrice" class="mb-1.5 block text-xs font-medium text-slate-400">
              Max price ($)
            </label>
            <input
              id="maxPrice"
              type="number"
              min={0}
              step="0.01"
              value={maxPrice()}
              onInput={(e) => setMaxPrice(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            />
          </div>
          <div class="flex items-end sm:col-span-2">
            <button
              type="button"
              onClick={resetFilters}
              class="rounded-full border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
            >
              Reset filters
            </button>
          </div>
        </div>
      </form>

      <p class="text-sm text-slate-400">
        Showing {filtered().length} of {props.products.length} products
      </p>

      <Show
        when={filtered().length > 0}
        fallback={
          <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center text-slate-400">
            No products match your filters.
          </div>
        }
      >
        <div id="product-catalog" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered().map((product) => (
              <article class="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl transition hover:border-volt-500/40">
                <a href={`/products/${product.slug}`} class="block">
                  <div class="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8">
                    <img
                      src={product.image}
                      alt=""
                      class="h-28 w-28 object-contain opacity-90 transition group-hover:scale-105"
                      loading="lazy"
                      width={112}
                      height={112}
                    />
                    {product.badge && (
                      <span class="absolute left-3 top-3 rounded-full bg-volt-600/90 px-2.5 py-1 text-xs font-medium text-white">
                        {product.badge}
                      </span>
                    )}
                  </div>
                </a>
                <div class="flex flex-1 flex-col gap-3 p-5">
                  <p class="text-xs font-medium uppercase tracking-wider text-stream-400">
                    {product.categoryName}
                  </p>
                  <h3 class="text-lg font-semibold text-white">
                    <a href={`/products/${product.slug}`} class="hover:text-volt-300">
                      {product.name}
                    </a>
                  </h3>
                  <p class="flex-1 text-sm leading-relaxed text-slate-400 line-clamp-2">
                    {product.description}
                  </p>
                  <div class="flex items-center justify-between gap-3 pt-2">
                    <p class="text-xl font-semibold text-white">
                      ${product.price.toFixed(2)}
                    </p>
                    <div class="flex flex-col items-end gap-2">
                      <a
                        href={`/products/${product.slug}#reviews`}
                        class="text-xs text-volt-400 hover:text-volt-300"
                      >
                        Reviews
                      </a>
                      <div class="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          data-add-cart
                          data-product-id={product.id}
                          data-product-name={product.name}
                          data-product-price={product.price}
                          class="rounded-full bg-volt-600 px-4 py-2 text-sm font-medium text-white hover:bg-volt-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          Add to cart
                        </button>
                        <span
                          class="hidden text-xs font-medium text-stream-400"
                          data-cart-feedback
                          role="status"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
          ))}
        </div>
      </Show>
    </div>
  );
}
