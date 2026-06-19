import { ProductCategory, Prisma } from "@prisma/client";

export type ProductSort = "newest" | "price-asc" | "price-desc" | "name";

export type ProductFilters = {
  q?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
};

export function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.inStock === true) {
    where.inStock = true;
  }

  const priceFilter: Prisma.DecimalFilter = {};
  if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
    priceFilter.gte = filters.minPrice;
  }
  if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
    priceFilter.lte = filters.maxPrice;
  }
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  return where;
}

export function buildProductOrderBy(
  sort: ProductSort = "newest",
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "name":
      return { name: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export function parseProductFilters(
  params: Record<string, string | string[] | undefined>,
): ProductFilters {
  const get = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  const category = get("category");
  const validCategories = Object.values(ProductCategory);

  return {
    q: get("q"),
    category:
      category && validCategories.includes(category as ProductCategory)
        ? (category as ProductCategory)
        : undefined,
    minPrice: get("minPrice") ? parseFloat(get("minPrice")!) : undefined,
    maxPrice: get("maxPrice") ? parseFloat(get("maxPrice")!) : undefined,
    inStock: get("inStock") === "true" ? true : undefined,
    sort: (get("sort") as ProductSort) || "newest",
  };
}
