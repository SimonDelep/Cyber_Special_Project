import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { reviewSchema } from "@/lib/reviews/validation";
import { saveImageFile, isValidImageUrl } from "@/lib/uploads/image";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to submit a review", 401);

  const { slug } = await params;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return jsonError("Product not found", 404);

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: { userId: user.id, productId: product.id },
    },
  });
  if (existing) {
    return jsonError("You have already reviewed this product", 409);
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let rating: number;
    let title: string | null = null;
    let content: string;
    let imageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      rating = Number(formData.get("rating"));
      const titleField = formData.get("title") as string;
      content = formData.get("content") as string;
      const urlField = formData.get("imageUrl") as string | null;
      const file = formData.get("image");

      const parsed = reviewSchema.safeParse({
        rating,
        title: titleField ?? "",
        content,
        imageUrl: urlField ?? "",
      });

      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }

      title = parsed.data.title || null;
      content = parsed.data.content;

      if (file && file instanceof File && file.size > 0) {
        imageUrl = await saveImageFile("reviews", user.id, file);
      } else if (parsed.data.imageUrl) {
        if (!isValidImageUrl(parsed.data.imageUrl)) {
          return jsonError("Invalid image URL", 400);
        }
        imageUrl = parsed.data.imageUrl;
      }
    } else {
      const body = await request.json();
      const parsed = reviewSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }

      rating = parsed.data.rating;
      title = parsed.data.title || null;
      content = parsed.data.content;

      if (parsed.data.imageUrl) {
        if (!isValidImageUrl(parsed.data.imageUrl)) {
          return jsonError("Invalid image URL", 400);
        }
        imageUrl = parsed.data.imageUrl;
      }
    }

    const review = await prisma.review.create({
      data: {
        rating,
        title: title || null,
        content,
        imageUrl,
        userId: user.id,
        productId: product.id,
      },
      include: {
        user: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.REVIEW,
      action: LOG_ACTIONS.REVIEW_CREATE,
      message: `Review submitted by "${user.username}" for "${product.name}" (${rating}★)`,
      userId: user.id,
      username: user.username,
      metadata: {
        productId: product.id,
        productSlug: slug,
        reviewId: review.id,
        rating,
      },
      request,
    });

    return jsonSuccess(
      {
        review: {
          id: review.id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          imageUrl: review.imageUrl,
          createdAt: review.createdAt.toISOString(),
          user: review.user,
        },
        message: "Review submitted",
      },
      201,
    );
  } catch (error) {
    console.error("[review POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    return jsonError(message, 500);
  }
}
