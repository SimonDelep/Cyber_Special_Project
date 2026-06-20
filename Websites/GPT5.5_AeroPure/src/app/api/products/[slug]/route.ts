import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return jsonError("Product not found", 404);

  const ratings = product.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : null;

  return jsonSuccess({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      featured: product.featured,
      inStock: product.inStock,
      reviewCount: product._count.reviews,
      avgRating,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    },
  });
}
