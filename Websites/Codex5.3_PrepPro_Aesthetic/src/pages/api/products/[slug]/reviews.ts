import type { APIRoute } from "astro";
import { findProductBySlug } from "@/db/products";
import {
  createReview,
  findReviewByUserAndProduct,
  getAverageRating,
  listReviewsByProductId,
} from "@/db/reviews";
import {
  validateComment,
  validateRating,
  validateReviewImageUrl,
} from "@/lib/reviews/validate";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ params }) => {
  const slug = params.slug;
  if (!slug) return errorResponse("Product not found.", 404);

  const product = findProductBySlug(slug);
  if (!product) return errorResponse("Product not found.", 404);

  const reviews = listReviewsByProductId(product.id);
  const stats = getAverageRating(product.id);

  return jsonResponse({
    reviews,
    stats: {
      average: Math.round(stats.average * 10) / 10,
      count: stats.count,
    },
  });
};

export const POST: APIRoute = async ({ params, locals, request }) => {
  if (!locals.user) {
    return errorResponse("Sign in to submit a review.", 401);
  }

  const slug = params.slug;
  if (!slug) return errorResponse("Product not found.", 404);

  const product = findProductBySlug(slug);
  if (!product) return errorResponse("Product not found.", 404);

  const existing = findReviewByUserAndProduct(locals.user.id, product.id);
  if (existing) {
    return errorResponse("You have already reviewed this product.", 409);
  }

  try {
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "");
    const imageUrl = String(body.imageUrl ?? "").trim();

    const errors: string[] = [];
    const ratingErr = validateRating(rating);
    const commentErr = validateComment(comment);
    const imageErr = validateReviewImageUrl(imageUrl);
    if (ratingErr) errors.push(ratingErr);
    if (commentErr) errors.push(commentErr);
    if (imageErr) errors.push(imageErr);

    if (errors.length > 0) {
      return errorResponse(errors.join(" "), 400);
    }

    const review = createReview({
      productId: product.id,
      userId: locals.user.id,
      rating,
      comment,
      imageUrl: imageUrl || null,
    });

    const stats = getAverageRating(product.id);

    return jsonResponse(
      {
        review: {
          ...review,
          authorDisplayName: locals.user.displayName,
          authorUsername: locals.user.username,
          authorAvatarUrl: locals.user.avatarUrl,
        },
        stats: {
          average: Math.round(stats.average * 10) / 10,
          count: stats.count,
        },
      },
      201,
    );
  } catch {
    return errorResponse("Failed to submit review.", 500);
  }
};
