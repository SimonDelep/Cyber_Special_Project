export type CategoryFilter = "all" | "keyboard" | "mouse" | "desk_mat";

export type SortOption = "name" | "price_asc" | "price_desc";

export interface CatalogFilters {
  search: string;
  category: CategoryFilter;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
}

export const defaultCatalogFilters: CatalogFilters = {
  search: "",
  category: "all",
  minPrice: "",
  maxPrice: "",
  sort: "name",
};
