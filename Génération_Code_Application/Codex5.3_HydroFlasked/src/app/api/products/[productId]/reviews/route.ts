import { getSessionUser } from "@/lib/auth/session";
import { validateImageUrl } from "@/lib/auth/avatar";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toPublicReview, toPublicReviews } from "@/lib/reviews/serializers";
import { formatZodErrors, reviewSchema } from "@/lib/reviews/validation";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return jsonError("Product not found", 404);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ reviews: toPublicReviews(reviews) });
  } catch (err) {
    console.error("GET reviews error:", err);
    return jsonError("Failed to load reviews", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return jsonError("Sign in to submit a review", 401);

    const { productId } = await context.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return jsonError("Product not found", 404);

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrors(parsed.error));
    }

    const { rating, title, content, imageUrl } = parsed.data;

    if (imageUrl) {
      const urlError = validateImageUrl(imageUrl);
      if (urlError) return jsonError(urlError);
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: sessionUser.id,
          productId,
        },
      },
      create: {
        userId: sessionUser.id,
        productId,
        rating,
        title: title ?? null,
        content,
        imageUrl: imageUrl ?? null,
      },
      update: {
        rating,
        title: title ?? null,
        content,
        imageUrl: imageUrl ?? null,
      },
      include: { user: true },
    });

    return jsonOk({ review: toPublicReview(review) });
  } catch (err) {
    console.error("POST review error:", err);
    return jsonError("Failed to save review", 500);
  }
}
