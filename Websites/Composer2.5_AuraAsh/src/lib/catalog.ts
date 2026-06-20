import type { CatalogFilters, CatalogSort, ProductItem } from "@/types";

export const defaultCatalogFilters: CatalogFilters = {
  search: "",
  category: "ALL",
  stock: "all",
  sort: "featured",
};

export function filterProducts(
  products: ProductItem[],
  filters: CatalogFilters,
): ProductItem[] {
  const query = filters.search.trim().toLowerCase();

  let result = products.filter((product) => {
    if (filters.category !== "ALL" && product.category !== filters.category) {
      return false;
    }

    if (filters.stock === "in-stock" && !product.inStock) return false;
    if (filters.stock === "out-of-stock" && product.inStock) return false;

    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query)
    );
  });

  result = [...result].sort((a, b) => compareProducts(a, b, filters.sort));
  return result;
}

function compareProducts(
  a: ProductItem,
  b: ProductItem,
  sort: CatalogSort,
): number {
  switch (sort) {
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "price-asc":
      return a.price - b.price;
    case "price-desc":
      return b.price - a.price;
    case "featured":
    default:
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
  }
}
