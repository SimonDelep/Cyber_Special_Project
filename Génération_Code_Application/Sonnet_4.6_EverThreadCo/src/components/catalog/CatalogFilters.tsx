"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type CategoryOption = { slug: string; name: string };

type CatalogFiltersProps = {
  categories: CategoryOption[];
  current: {
    q: string;
    category: string;
    minPrice: string;
    maxPrice: string;
    inStock: string;
    featured: string;
    sort: string;
  };
};

export function CatalogFilters({ categories, current }: CatalogFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const applyFilters = useCallback(
    (formData: FormData) => {
      const params = new URLSearchParams();

      const q = formData.get("q")?.toString().trim();
      const category = formData.get("category")?.toString();
      const minPrice = formData.get("minPrice")?.toString().trim();
      const maxPrice = formData.get("maxPrice")?.toString().trim();
      const inStock = formData.get("inStock")?.toString();
      const featured = formData.get("featured")?.toString();
      const sort = formData.get("sort")?.toString();

      if (q) params.set("q", q);
      if (category && category !== "all") params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStock && inStock !== "all") params.set("inStock", inStock);
      if (featured === "true") params.set("featured", "true");
      if (sort && sort !== "newest") params.set("sort", sort);

      startTransition(() => {
        router.push(`/catalog?${params.toString()}`);
      });
    },
    [router],
  );

  function clearFilters() {
    startTransition(() => {
      router.push("/catalog");
    });
  }

  return (
    <form
      action={applyFilters}
      className="rounded-2xl border border-sand-200 bg-cream-50 p-6"
    >
      <h2 className="font-display text-lg text-sand-900">Search & filter</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Search"
          name="q"
          defaultValue={current.q}
          placeholder="Name or description…"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-sand-800">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={current.category || "all"}
            className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sort" className="text-sm font-medium text-sand-800">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={current.sort || "newest"}
            className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
          </select>
        </div>

        <Input
          label="Min price (CAD)"
          name="minPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={current.minPrice}
          placeholder="0"
        />
        <Input
          label="Max price (CAD)"
          name="maxPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={current.maxPrice}
          placeholder="200"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="inStock" className="text-sm font-medium text-sand-800">
            Availability
          </label>
          <select
            id="inStock"
            name="inStock"
            defaultValue={current.inStock || "all"}
            className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
          >
            <option value="all">All</option>
            <option value="true">In stock only</option>
            <option value="false">Out of stock</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2.5 text-sm text-sand-800">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={current.featured === "true"}
            />
            Featured only
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying…" : "Apply filters"}
        </Button>
        <Button type="button" variant="secondary" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </form>
  );
}
