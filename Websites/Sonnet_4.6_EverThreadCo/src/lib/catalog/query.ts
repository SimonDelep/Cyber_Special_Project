import type { Prisma } from "@/generated/prisma/client";

export type CatalogSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  featured?: string;
  sort?: string;
};

function parsePriceToCents(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

export function buildCatalogWhere(
  params: CatalogSearchParams,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const categorySlug = params.category?.trim();
  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug };
  }

  const minCents = parsePriceToCents(params.minPrice);
  const maxCents = parsePriceToCents(params.maxPrice);
  if (minCents !== undefined || maxCents !== undefined) {
    where.priceCents = {
      ...(minCents !== undefined ? { gte: minCents } : {}),
      ...(maxCents !== undefined ? { lte: maxCents } : {}),
    };
  }

  if (params.inStock === "true") where.inStock = true;
  if (params.inStock === "false") where.inStock = false;

  if (params.featured === "true") where.featured = true;

  return where;
}

export function buildCatalogOrderBy(
  sort: string | undefined,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort as CatalogSort) {
    case "price-asc":
      return [{ priceCents: "asc" }];
    case "price-desc":
      return [{ priceCents: "desc" }];
    case "name-asc":
      return [{ name: "asc" }];
    case "name-desc":
      return [{ name: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export function catalogParamsFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogSearchParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  return {
    q: get("q"),
    category: get("category"),
    minPrice: get("minPrice"),
    maxPrice: get("maxPrice"),
    inStock: get("inStock"),
    featured: get("featured"),
    sort: get("sort"),
  };
}

export function averageRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
