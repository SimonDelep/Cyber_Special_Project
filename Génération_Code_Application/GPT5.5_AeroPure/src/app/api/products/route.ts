import { prisma } from "@/lib/prisma";
import {
  buildProductOrderBy,
  buildProductWhere,
  parseProductFilters,
} from "@/lib/products/query";
import { jsonSuccess } from "@/lib/auth/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const filters = parseProductFilters(params);
  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters.sort);

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  const results = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      category: p.category,
      featured: p.featured,
      inStock: p.inStock,
      reviewCount: p._count.reviews,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    };
  });

  return jsonSuccess({ products: results, count: results.length });
}
