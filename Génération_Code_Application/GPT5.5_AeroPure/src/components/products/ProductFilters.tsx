"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ProductCategory } from "@prisma/client";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = formData.get("q") as string;
    const category = formData.get("category") as string;
    const minPrice = formData.get("minPrice") as string;
    const maxPrice = formData.get("maxPrice") as string;
    const inStock = formData.get("inStock") as string;
    const sort = formData.get("sort") as string;

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock === "true") params.set("inStock", "true");
    if (sort) params.set("sort", sort);

    router.push(`/products?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/products");
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="font-semibold">Search & filter</h2>

      <div>
        <label htmlFor="q" className="block text-sm font-medium">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Product name or keyword…"
          defaultValue={searchParams.get("q") ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className={`mt-1 ${inputClass}`}
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option
              key={c.id}
              value={
                c.id === "wireless"
                  ? ProductCategory.WIRELESS_CHARGING
                  : c.id === "solar"
                    ? ProductCategory.SOLAR_POWER_BANK
                    : ProductCategory.TRAVEL_ORGANIZER
              }
            >
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium">
            Min price
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            defaultValue={searchParams.get("minPrice") ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium">
            Max price
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="inStock"
          value="true"
          defaultChecked={searchParams.get("inStock") === "true"}
          className="rounded border-border"
        />
        In stock only
      </label>

      <div>
        <label htmlFor="sort" className="block text-sm font-medium">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={searchParams.get("sort") ?? "newest"}
          className={`mt-1 ${inputClass}`}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-border/50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
