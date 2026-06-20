"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/home/ProductCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { defaultCatalogFilters, filterProducts } from "@/lib/catalog";
import { categoryLabels } from "@/lib/product-constants";
import type { CatalogFilters, ProductItem } from "@/types";

interface ProductCatalogProps {
  products: ProductItem[];
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export function ProductCatalog({
  products,
  title = "Product catalog",
  subtitle = "Search and filter our handcrafted collection.",
  showHeader = true,
}: ProductCatalogProps) {
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [products, filters],
  );

  function updateFilter<K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      {showHeader && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
            Catalog
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium text-charcoal">
            {title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-stone">{subtitle}</p>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-stone/15 bg-warm-white p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            name="search"
            placeholder="Search by name or description..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />

          <Select
            label="Category"
            name="category"
            value={filters.category}
            onChange={(e) =>
              updateFilter(
                "category",
                e.target.value as CatalogFilters["category"],
              )
            }
            options={[
              { value: "ALL", label: "All categories" },
              { value: "CANDLES", label: categoryLabels.CANDLES },
              { value: "INCENSE_HOLDERS", label: categoryLabels.INCENSE_HOLDERS },
              { value: "DIFFUSERS", label: categoryLabels.DIFFUSERS },
            ]}
          />

          <Select
            label="Availability"
            name="stock"
            value={filters.stock}
            onChange={(e) =>
              updateFilter("stock", e.target.value as CatalogFilters["stock"])
            }
            options={[
              { value: "all", label: "All products" },
              { value: "in-stock", label: "In stock only" },
              { value: "out-of-stock", label: "Out of stock" },
            ]}
          />

          <Select
            label="Sort by"
            name="sort"
            value={filters.sort}
            onChange={(e) =>
              updateFilter("sort", e.target.value as CatalogFilters["sort"])
            }
            options={[
              { value: "featured", label: "Featured first" },
              { value: "name-asc", label: "Name (A–Z)" },
              { value: "name-desc", label: "Name (Z–A)" },
              { value: "price-asc", label: "Price (low to high)" },
              { value: "price-desc", label: "Price (high to low)" },
            ]}
          />
        </div>

        <p className="mt-4 text-sm text-stone">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-dashed border-stone/25 bg-cream/40 px-6 py-16 text-center">
          <p className="font-display text-xl text-charcoal">No products found</p>
          <p className="mt-2 text-sm text-stone">
            Try adjusting your search or filters.
          </p>
          <button
            type="button"
            onClick={() => setFilters(defaultCatalogFilters)}
            className="mt-6 text-sm font-medium text-ember transition-colors hover:text-ember-dark"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}
