"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PRODUCT_CATEGORIES,
  type ProductSearchParams,
} from "@/lib/product-filters";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";

const labelClass = "block text-xs font-medium uppercase tracking-wider text-zinc-500";

interface ProductSearchBarProps {
  values: ProductSearchParams;
  hasFilters: boolean;
}

function buildSearchHref(form: HTMLFormElement): string {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form).entries()) {
    const trimmed = String(value).trim();
    if (trimmed !== "") {
      params.set(key, trimmed);
    }
  }
  const query = params.toString();
  return query ? `/?${query}#featured` : "/#featured";
}

export function ProductSearchBar({ values, hasFilters }: ProductSearchBarProps) {
  const router = useRouter();

  return (
    <form
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(buildSearchHref(event.currentTarget));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
          <label htmlFor="q" className={labelClass}>
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={values.q ?? ""}
            placeholder="Name or description…"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={values.category ?? ""}
            className={inputClass}
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <label htmlFor="minPrice" className={labelClass}>
            Min price
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={values.minPrice ?? ""}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <label htmlFor="maxPrice" className={labelClass}>
            Max price
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={values.maxPrice ?? ""}
            placeholder="Any"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
        >
          Search products
        </button>
        {hasFilters ? (
          <Link
            href="/#featured"
            className="text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
