import type { Prisma } from "@/generated/prisma/client";
import type { ProductCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { CatalogQuery } from "@/lib/validations/catalog";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string | null;
  origin: string | null;
  roastLevel: string | null;
  isEthical: boolean;
};

export type ProductWithReviews = ProductCardData & {
  averageRating: number | null;
  reviewCount: number;
};

export type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
};

export type ProductDetail = ProductCardData & {
  reviews: ReviewData[];
  averageRating: number | null;
  reviewCount: number;
};

export async function getActiveProducts(): Promise<ProductCardData[]> {
  return db.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: productCardSelect,
  });
}

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  category: true,
  priceCents: true,
  imageUrl: true,
  origin: true,
  roastLevel: true,
  isEthical: true,
} as const;

function buildCatalogWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { origin: { contains: term, mode: "insensitive" } },
    ];
  }

  if (query.category && query.category !== "ALL") {
    where.category = query.category;
  }

  if (query.roastLevel?.trim()) {
    where.roastLevel = { equals: query.roastLevel.trim(), mode: "insensitive" };
  }

  if (query.ethical === "true") {
    where.isEthical = true;
  } else if (query.ethical === "false") {
    where.isEthical = false;
  }

  const priceFilter: Prisma.IntFilter = {};
  if (query.minPrice !== undefined) {
    priceFilter.gte = Math.round(query.minPrice * 100);
  }
  if (query.maxPrice !== undefined) {
    priceFilter.lte = Math.round(query.maxPrice * 100);
  }
  if (Object.keys(priceFilter).length > 0) {
    where.priceCents = priceFilter;
  }

  return where;
}

function buildCatalogOrderBy(
  sort?: CatalogQuery["sort"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceCents: "asc" }];
    case "price_desc":
      return [{ priceCents: "desc" }];
    default:
      return [{ name: "asc" }];
  }
}

export async function searchProducts(
  query: CatalogQuery,
): Promise<ProductWithReviews[]> {
  const products = await db.product.findMany({
    where: buildCatalogWhere(query),
    orderBy: buildCatalogOrderBy(query.sort),
    select: {
      ...productCardSelect,
      reviews: { select: { rating: true } },
    },
  });

  return products.map(({ reviews, ...product }) => {
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;
    return { ...product, reviewCount, averageRating };
  });
}

export async function getDistinctRoastLevels(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, roastLevel: { not: null } },
    select: { roastLevel: true },
    distinct: ["roastLevel"],
    orderBy: { roastLevel: "asc" },
  });
  return rows
    .map((r) => r.roastLevel)
    .filter((level): level is string => Boolean(level));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await db.product.findFirst({
    where: { slug, isActive: true },
    select: {
      ...productCardSelect,
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          imageUrl: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!product) return null;

  const { reviews, ...rest } = product;
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return { ...rest, reviews, reviewCount, averageRating };
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string,
) {
  return db.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { id: true },
  });
}
