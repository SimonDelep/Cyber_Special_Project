import type { Prisma, ProductCategory } from "@prisma/client";

export type CatalogSort = "name_asc" | "price_asc" | "price_desc" | "newest";

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

const SORT_OPTIONS: CatalogSort[] = ["name_asc", "price_asc", "price_desc", "newest"];

export function parseCatalogParams(searchParams: CatalogSearchParams) {
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category?.trim() ?? "";
  const inStock = searchParams.inStock?.trim() ?? "";
  const minPrice = searchParams.minPrice?.trim() ?? "";
  const maxPrice = searchParams.maxPrice?.trim() ?? "";
  const sortRaw = searchParams.sort?.trim() ?? "name_asc";
  const sort: CatalogSort = SORT_OPTIONS.includes(sortRaw as CatalogSort)
    ? (sortRaw as CatalogSort)
    : "name_asc";

  return { q, category, inStock, minPrice, maxPrice, sort };
}

export function buildProductWhere(params: ReturnType<typeof parseCatalogParams>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { slug: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.category && params.category !== "all") {
    where.category = params.category as ProductCategory;
  }

  if (params.inStock === "true") {
    where.inStock = true;
  } else if (params.inStock === "false") {
    where.inStock = false;
  }

  const minCents = params.minPrice ? Math.round(Number(params.minPrice) * 100) : NaN;
  const maxCents = params.maxPrice ? Math.round(Number(params.maxPrice) * 100) : NaN;
  const priceFilter: Prisma.IntFilter = {};

  if (!Number.isNaN(minCents) && minCents >= 0) {
    priceFilter.gte = minCents;
  }
  if (!Number.isNaN(maxCents) && maxCents >= 0) {
    priceFilter.lte = maxCents;
  }
  if (Object.keys(priceFilter).length > 0) {
    where.priceCents = priceFilter;
  }

  return where;
}

export function buildProductOrderBy(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { priceCents: "asc" };
    case "price_desc":
      return { priceCents: "desc" };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { name: "asc" };
  }
}

export function averageRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
