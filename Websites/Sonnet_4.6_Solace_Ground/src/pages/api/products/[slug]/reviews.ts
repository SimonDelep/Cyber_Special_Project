import type { APIRoute } from 'astro';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db';
import { reviews } from '@/db/schema';
import { getProductBySlug } from '@/lib/catalog/query';
import {
  getReviewsForProduct,
  getUserReviewForProduct,
} from '@/lib/reviews/queries';
import { validateReviewInput } from '@/lib/reviews/validation';
import { deleteLocalUpload } from '@/lib/uploads/image';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/api';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';

export const prerender = false;

const REVIEW_PUBLIC_PREFIX = '/uploads/reviews';

export const GET: APIRoute = ({ params, locals }) => {
  const product = getProductBySlug(params.slug!);
  if (!product) return errorResponse('Product not found.', 404);

  const list = getReviewsForProduct(product.id);
  const ownReview = locals.user
    ? getUserReviewForProduct(product.id, locals.user.id)
    : null;

  return jsonResponse({ reviews: list, ownReview });
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return errorResponse('Sign in to leave a review.', 401);
  }

  const product = getProductBySlug(params.slug!);
  if (!product) return errorResponse('Product not found.', 404);

  const body = await parseJsonBody<{
    rating?: number;
    title?: string;
    body?: string;
    imageUrl?: string;
  }>(request);

  if (!body) return errorResponse('Invalid request body.', 400);

  const errors = validateReviewInput({
    rating: body.rating,
    title: body.title,
    body: body.body,
    imageUrl: body.imageUrl,
  });

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const db = getDb();
  const now = new Date().toISOString();
  const imageUrl = body.imageUrl?.trim() || null;

  const existing = db
    .select()
    .from(reviews)
    .where(
      and(eq(reviews.productId, product.id), eq(reviews.userId, locals.user.id)),
    )
    .get();

  if (existing?.imageUrl && imageUrl !== existing.imageUrl) {
    deleteLocalUpload(existing.imageUrl, REVIEW_PUBLIC_PREFIX);
  }

  if (existing) {
    db.update(reviews)
      .set({
        rating: body.rating!,
        title: body.title?.trim() || null,
        body: body.body!.trim(),
        imageUrl,
        updatedAt: now,
      })
      .where(eq(reviews.id, existing.id))
      .run();
  } else {
    db.insert(reviews)
      .values({
        productId: product.id,
        userId: locals.user.id,
        rating: body.rating!,
        title: body.title?.trim() || null,
        body: body.body!.trim(),
        imageUrl,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  const saved = getUserReviewForProduct(product.id, locals.user.id);

  logEvent({
    action: LOG_ACTIONS.REVIEW_SUBMIT,
    category: 'review',
    status: 'success',
    message: `${existing ? 'Updated' : 'Submitted'} review on ${product.name} by ${locals.user.username}`,
    userId: locals.user.id,
    username: locals.user.username,
    request,
    metadata: {
      productId: product.id,
      productSlug: product.slug,
      rating: body.rating,
    },
  });

  return jsonResponse({ review: saved }, existing ? 200 : 201);
};

export const DELETE: APIRoute = ({ params, request, locals }) => {
  if (!locals.user) {
    return errorResponse('Sign in to manage your review.', 401);
  }

  const product = getProductBySlug(params.slug!);
  if (!product) return errorResponse('Product not found.', 404);

  const db = getDb();
  const existing = db
    .select()
    .from(reviews)
    .where(
      and(eq(reviews.productId, product.id), eq(reviews.userId, locals.user.id)),
    )
    .get();

  if (!existing) {
    return errorResponse('Review not found.', 404);
  }

  logEvent({
    action: LOG_ACTIONS.REVIEW_DELETE,
    category: 'review',
    status: 'success',
    message: `Review deleted on ${product.name} by ${locals.user.username}`,
    userId: locals.user.id,
    username: locals.user.username,
    request,
    metadata: { productId: product.id, reviewId: existing.id },
  });

  deleteLocalUpload(existing.imageUrl, REVIEW_PUBLIC_PREFIX);
  db.delete(reviews).where(eq(reviews.id, existing.id)).run();

  return jsonResponse({ ok: true });
};
