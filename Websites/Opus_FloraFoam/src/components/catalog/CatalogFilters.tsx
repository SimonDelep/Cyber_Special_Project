"use client";

import { useRouter } from "next/navigation";
import { CATEGORY_LABELS } from "@/types/product";
import type { ProductCategory } from "@prisma/client";
import type { CatalogSearchParams } from "@/lib/products/catalog-query";

type CatalogFiltersProps = {
  params: CatalogSearchParams;
};

const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export function CatalogFilters({ params }: CatalogFiltersProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const search = new URLSearchParams();

    const q = (data.get("q") as string)?.trim();
    const category = data.get("category") as string;
    const inStock = data.get("inStock") as string;
    const minPrice = (data.get("minPrice") as string)?.trim();
    const maxPrice = (data.get("maxPrice") as string)?.trim();
    const sort = data.get("sort") as string;

    if (q) search.set("q", q);
    if (category && category !== "all") search.set("category", category);
    if (inStock && inStock !== "all") search.set("inStock", inStock);
    if (minPrice) search.set("minPrice", minPrice);
    if (maxPrice) search.set("maxPrice", maxPrice);
    if (sort && sort !== "name_asc") search.set("sort", sort);

    const query = search.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  function handleReset() {
    router.push("/products");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-sage-200/80 bg-cream-50 p-6"
    >
      <h2 className="font-display text-lg font-semibold text-sage-900">Search & filter</h2>

      <div>
        <label htmlFor="q" className="block text-sm font-medium text-sage-800">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={params.q ?? ""}
          placeholder="Name or description…"
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-sage-800">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={params.category ?? "all"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="inStock" className="block text-sm font-medium text-sage-800">
          Availability
        </label>
        <select
          id="inStock"
          name="inStock"
          defaultValue={params.inStock ?? "all"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900"
        >
          <option value="all">All products</option>
          <option value="true">In stock only</option>
          <option value="false">Out of stock</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-sage-800">
            Min price ($)
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={params.minPrice ?? ""}
            className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-sage-800">
            Max price ($)
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={params.maxPrice ?? ""}
            className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sort" className="block text-sm font-medium text-sage-800">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={params.sort ?? "name_asc"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900"
        >
          <option value="name_asc">Name (A–Z)</option>
          <option value="price_asc">Price (low to high)</option>
          <option value="price_desc">Price (high to low)</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          className="rounded-full bg-sage-700 px-5 py-2 text-sm font-medium text-cream-50 hover:bg-sage-900"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
