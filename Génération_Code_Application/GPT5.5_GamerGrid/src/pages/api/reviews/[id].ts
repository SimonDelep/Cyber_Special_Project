import type { APIRoute } from 'astro';
import { requireAuthApi } from '@/lib/auth/guards';
import { deleteReview, setReviewImage } from '@/lib/reviews';
import { errorResponse, jsonResponse } from '@/lib/http';

export const DELETE: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const reviewId = context.params.id;
  if (!reviewId) return errorResponse('Review id required.', 400);

  try {
    await deleteReview(reviewId, user.id);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    return errorResponse(message, 400);
  }
};

export const POST: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const reviewId = context.params.id;
  if (!reviewId) return errorResponse('Review id required.', 400);

  const formData = await context.request.formData();
  const image = formData.get('image');

  if (!(image instanceof File) || image.size === 0) {
    return errorResponse('Please provide an image file.', 400);
  }

  try {
    const review = await setReviewImage(reviewId, user.id, image);
    return jsonResponse({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return errorResponse(message, 400);
  }
};
