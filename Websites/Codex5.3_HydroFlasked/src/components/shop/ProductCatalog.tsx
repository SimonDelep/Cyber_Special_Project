"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductCategory } from "../../../generated/prisma/client";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  category: ProductCategory;
  imageUrl: string | null;
  featured: boolean;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
};
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatPrice } from "@/lib/format";
import {
  CATEGORY_FILTER_OPTIONS,
  CATEGORY_LABELS,
  SORT_OPTIONS,
  type SortOption,
} from "@/lib/shop/constants";

type ProductCatalogProps = {
  products: CatalogProduct[];
};

function parseCategory(value: string | null): ProductCategory | "ALL" {
  if (value === "TUMBLER" || value === "GLASSWARE" || value === "WINE_MUG") {
    return value;
  }
  return "ALL";
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const initialCategory = parseCategory(searchParams.get("category"));
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<ProductCategory | "ALL">(initialCategory);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");

  useEffect(() => {
    setCategory(parseCategory(searchParams.get("category")));
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minCents = minPrice ? Math.round(Number.parseFloat(minPrice) * 100) : null;
    const maxCents = maxPrice ? Math.round(Number.parseFloat(maxPrice) * 100) : null;

    let list = products.filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (inStockOnly && !p.inStock) return false;
      if (q) {
        const haystack = `${p.name} ${p.description} ${p.slug}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (minCents !== null && !Number.isNaN(minCents) && p.priceCents < minCents) {
        return false;
      }
      if (maxCents !== null && !Number.isNaN(maxCents) && p.priceCents > maxCents) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.priceCents - b.priceCents;
        case "price-desc":
          return b.priceCents - a.priceCents;
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [products, query, category, inStockOnly, minPrice, maxPrice, sort]);

  function resetFilters() {
    setQuery("");
    setCategory("ALL");
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSort("name-asc");
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Search & filters
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filtered.length} of {products.length} products
          </p>
        </div>

        <label className="block">
          <span className="text-sm text-slate-300">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or description…"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-300">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory | "ALL")}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {CATEGORY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-white/20"
          />
          In stock only
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">Min price ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-2 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Max price ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-2 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-slate-300">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Reset filters
        </button>
      </aside>

      <div>
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-slate-500">
            No products match your filters. Try adjusting search or category.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <li
                key={product.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-6"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
                  {CATEGORY_LABELS[product.category]}
                </span>
                <Link
                  href={`/shop/${product.slug}`}
                  className="mt-2 text-lg font-semibold text-white transition hover:text-brand-300"
                >
                  {product.name}
                </Link>
                <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-3">
                  {product.description}
                </p>
                <p className="mt-4 text-lg font-semibold text-white">
                  {formatPrice(product.priceCents)}
                </p>
                {!product.inStock ? (
                  <p className="mt-1 text-xs text-amber-400">Out of stock</p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="text-center text-sm text-brand-400 hover:text-brand-300"
                  >
                    View details & reviews
                  </Link>
                  <AddToCartButton productId={product.id} disabled={!product.inStock} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
