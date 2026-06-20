import type { ProductCategory } from "../../../generated/prisma/client";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  TUMBLER: "Travel tumblers",
  GLASSWARE: "Custom glassware",
  WINE_MUG: "Wine mugs",
};

export const CATEGORY_FILTER_OPTIONS: { value: ProductCategory | "ALL"; label: string }[] =
  [
    { value: "ALL", label: "All categories" },
    { value: "TUMBLER", label: CATEGORY_LABELS.TUMBLER },
    { value: "GLASSWARE", label: CATEGORY_LABELS.GLASSWARE },
    { value: "WINE_MUG", label: CATEGORY_LABELS.WINE_MUG },
  ];

export type SortOption = "name-asc" | "price-asc" | "price-desc" | "newest";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "newest", label: "Newest" },
];
