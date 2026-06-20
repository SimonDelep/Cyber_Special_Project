import type { APIRoute } from 'astro';
import { resolveUserFromCookies } from '../../../../lib/auth/session';
import {
  validateReviewBody,
  validateReviewImageUrl,
  validateReviewRating,
} from '../../../../lib/auth/review-validation';
import { deleteUploadedImage, saveUploadedImage } from '../../../../lib/uploads/images';
import { findProductBySlug } from '../../../../lib/db/products';
import {
  findReviewByUserAndProduct,
  listReviewsByProductId,
  getProductReviewSummary,
  upsertReview,
} from '../../../../lib/db/reviews';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../../lib/api/response';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug?.trim();
  if (!slug) return errorResponse('Product not found.', 404);

  const product = findProductBySlug(slug);
  if (!product) return errorResponse('Product not found.', 404);

  const reviews = listReviewsByProductId(product.id);
  const summary = getProductReviewSummary(product.id);

  return jsonResponse({ reviews, summary });
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const user = resolveUserFromCookies(cookies);
  if (!user) return errorResponse('Sign in to submit a review.', 401);

  const slug = params.slug?.trim();
  if (!slug) return errorResponse('Product not found.', 404);

  const product = findProductBySlug(slug);
  if (!product) return errorResponse('Product not found.', 404);

  const contentType = request.headers.get('content-type') ?? '';
  let rating: unknown;
  let body: string = '';
  let imageUrl: string | null | undefined = undefined;
  let imageFile: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse('Invalid form data.');
    }
    rating = formData.get('rating');
    body = String(formData.get('body') ?? '');
    const urlField = String(formData.get('imageUrl') ?? '').trim();
    if (urlField) imageUrl = urlField;
    const file = formData.get('image');
    if (file instanceof File && file.size > 0) imageFile = file;
  } else {
    const json = await parseJsonBody<{
      rating?: number;
      body?: string;
      imageUrl?: string | null;
    }>(request);
    if (!json) return errorResponse('Invalid JSON body.');
    rating = json.rating;
    body = json.body ?? '';
    if (json.imageUrl !== undefined) {
      imageUrl = json.imageUrl?.trim() || null;
    }
  }

  const errors = [
    validateReviewRating(rating),
    validateReviewBody(body),
    imageUrl ? validateReviewImageUrl(imageUrl) : null,
  ].filter(Boolean);

  if (errors.length > 0) return errorResponse(errors[0]!);

  const existing = findReviewByUserAndProduct(user.id, product.id);
  let finalImageUrl: string | null =
    imageUrl !== undefined ? imageUrl : (existing?.imageUrl ?? null);

  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    try {
      const { publicPath } = saveUploadedImage(
        'reviews',
        buffer,
        imageFile.type || 'application/octet-stream',
      );
      if (existing?.imageUrl?.startsWith('/uploads/reviews/')) {
        deleteUploadedImage('reviews', existing.imageUrl);
      }
      finalImageUrl = publicPath;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed.';
      return errorResponse(message);
    }
  }

  const review = upsertReview({
    productId: product.id,
    userId: user.id,
    rating: Number(rating),
    body: body.trim(),
    imageUrl: finalImageUrl,
  });

  const summary = getProductReviewSummary(product.id);

  return jsonResponse({ review, summary }, existing ? 200 : 201);
};
