import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { reviews } from '@/db/schema';
import { getUserReviewForProduct } from '@/lib/reviews/queries';
import { deleteLocalUpload, saveUploadedImage } from '@/lib/uploads/image';
import { errorResponse, jsonResponse } from '@/lib/api';

export const prerender = false;

const REVIEW_UPLOAD_DIR = 'public/uploads/reviews';
const REVIEW_PUBLIC_PREFIX = '/uploads/reviews';

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return errorResponse('Authentication required.', 401);
  }

  const reviewId = Number(params.id);
  if (!Number.isInteger(reviewId) || reviewId < 1) {
    return errorResponse('Invalid review id.', 400);
  }

  const db = getDb();
  const review = db.select().from(reviews).where(eq(reviews.id, reviewId)).get();

  if (!review) return errorResponse('Review not found.', 404);
  if (review.userId !== locals.user.id) {
    return errorResponse('You can only update your own review.', 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Invalid form data.', 400);
  }

  const file = formData.get('image');
  if (!file || !(file instanceof File) || file.size === 0) {
    return errorResponse('Choose an image file to upload.', 400);
  }

  try {
    const imageUrl = await saveUploadedImage(
      REVIEW_UPLOAD_DIR,
      REVIEW_PUBLIC_PREFIX,
      `review-${reviewId}`,
      file,
    );

    deleteLocalUpload(review.imageUrl, REVIEW_PUBLIC_PREFIX);

    db.update(reviews)
      .set({
        imageUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviews.id, reviewId))
      .run();

    const updated = getUserReviewForProduct(review.productId, locals.user.id);
    return jsonResponse({ review: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return errorResponse(message, 400);
  }
};
