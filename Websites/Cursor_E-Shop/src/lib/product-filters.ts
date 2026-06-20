import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import type { ProductCategory } from "@/types";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "phones",
  "laptops",
  "audio",
  "accessories",
];

export type ProductSearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
};

export function parseProductSearchParams(
  params: ProductSearchParams
): {
  q: string;
  category: ProductCategory | "";
  minPrice: number | null;
  maxPrice: number | null;
  hasFilters: boolean;
} {
  const q = params.q?.trim() ?? "";
  const rawCategory = params.category?.trim() ?? "";
  const category = PRODUCT_CATEGORIES.includes(rawCategory as ProductCategory)
    ? (rawCategory as ProductCategory)
    : "";

  const minPrice = parsePriceParam(params.minPrice);
  const maxPrice = parsePriceParam(params.maxPrice);

  const hasFilters =
    q.length > 0 || category !== "" || minPrice !== null || maxPrice !== null;

  return { q, category, minPrice, maxPrice, hasFilters };
}

function parsePriceParam(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function buildProductWhere(
  filters: ReturnType<typeof parseProductSearchParams>
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    where.price = {};
    if (filters.minPrice !== null) {
      where.price.gte = new PrismaNamespace.Decimal(filters.minPrice);
    }
    if (filters.maxPrice !== null) {
      where.price.lte = new PrismaNamespace.Decimal(filters.maxPrice);
    }
  }

  return where;
}
