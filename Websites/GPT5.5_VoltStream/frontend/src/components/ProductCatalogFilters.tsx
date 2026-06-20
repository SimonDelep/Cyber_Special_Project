import type { CatalogFilters, CategoryFilter, SortOption } from "../types/catalog";

const categories: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All categories" },
  { id: "keyboard", label: "Keyboards" },
  { id: "mouse", label: "Mice" },
  { id: "desk_mat", label: "Desk mats" },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "name", label: "Name (A–Z)" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

interface Props {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  compact?: boolean;
}

export default function ProductCatalogFilters({ filters, onChange, compact = false }: Props) {
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });

  return (
    <div
      className={`rounded-2xl border border-grid-border bg-grid-surface/80 ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className={`grid gap-4 ${compact ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"}`}>
        <label className={compact ? "md:col-span-2" : "xl:col-span-2"}>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grid-muted">
            Search
          </span>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Name or description…"
            className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white placeholder:text-grid-muted focus:border-grid-cyan focus:outline-none"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grid-muted">
            Category
          </span>
          <select
            value={filters.category}
            onChange={(e) => set({ category: e.target.value as CategoryFilter })}
            className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white focus:border-grid-cyan focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grid-muted">
            Min price ($)
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={filters.minPrice}
            onChange={(e) => set({ minPrice: e.target.value })}
            placeholder="0"
            className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white placeholder:text-grid-muted focus:border-grid-cyan focus:outline-none"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grid-muted">
            Max price ($)
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={filters.maxPrice}
            onChange={(e) => set({ maxPrice: e.target.value })}
            placeholder="Any"
            className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white placeholder:text-grid-muted focus:border-grid-cyan focus:outline-none"
          />
        </label>

        <label className={compact ? "" : "xl:col-span-2"}>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-grid-muted">
            Sort by
          </span>
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as SortOption })}
            className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white focus:border-grid-cyan focus:outline-none"
          >
            {sortOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(filters.search || filters.category !== "all" || filters.minPrice || filters.maxPrice) && (
        <button
          type="button"
          onClick={() =>
            onChange({
              search: "",
              category: "all",
              minPrice: "",
              maxPrice: "",
              sort: filters.sort,
            })
          }
          className="mt-4 text-sm text-grid-cyan hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
