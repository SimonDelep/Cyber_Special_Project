import type { APIRoute } from 'astro';
import { requireAuthApi } from '@/lib/auth/guards';
import { getProductById } from '@/lib/products';
import {
  createReview,
  getReviewsForProduct,
  getUserReviewForProduct,
} from '@/lib/reviews';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';

export const GET: APIRoute = async ({ params, locals }) => {
  const productId = params.id;
  if (!productId) return errorResponse('Product id required.', 400);

  const product = await getProductById(productId);
  if (!product) return errorResponse('Product not found.', 404);

  const reviews = await getReviewsForProduct(productId);
  const userReview = locals.user
    ? await getUserReviewForProduct(productId, locals.user.id)
    : null;

  return jsonResponse({ reviews, userReview, product });
};

export const POST: APIRoute = async (context) => {
  const user = requireAuthApi(context);
  if (user instanceof Response) return user;

  const productId = context.params.id;
  if (!productId) return errorResponse('Product id required.', 400);

  const product = await getProductById(productId);
  if (!product) return errorResponse('Product not found.', 404);

  const contentType = context.request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await context.request.formData();
    const rating = Number(formData.get('rating'));
    const title = String(formData.get('title') ?? '');
    const body = String(formData.get('body') ?? '');
    const imageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
    const imageFile = formData.get('image');

    try {
      const review = await createReview({
        productId,
        userId: user.id,
        rating,
        title,
        body,
        imageUrl,
      });

      if (imageFile instanceof File && imageFile.size > 0) {
        const { setReviewImage } = await import('@/lib/reviews');
        const updated = await setReviewImage(review.id, user.id, imageFile);
        return jsonResponse({ review: updated }, 201);
      }

      return jsonResponse({ review }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create review.';
      return errorResponse(message, 400);
    }
  }

  const body = await parseJsonBody<{
    rating?: number;
    title?: string;
    body?: string;
    imageUrl?: string | null;
  }>(context.request);
  if (body instanceof Response) return body;

  if (body.rating === undefined || !body.title || !body.body) {
    return errorResponse('rating, title, and body are required.', 400);
  }

  try {
    const review = await createReview({
      productId,
      userId: user.id,
      rating: Number(body.rating),
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl,
    });
    return jsonResponse({ review }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create review.';
    return errorResponse(message, 400);
  }
};
