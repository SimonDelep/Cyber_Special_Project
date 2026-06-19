import type { APIRoute } from 'astro';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';
import { getProductBySlug } from '@/lib/products';
import { getUserReviewForProduct, upsertReview } from '@/lib/reviews';
import {
  deleteLocalReviewImage,
  saveReviewImageFile,
  validateReviewImageUrl,
} from '@/lib/review-images';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user ?? null;
  if (!user) {
    return redirectResponse('/login?redirect=/catalog');
  }

  const form = await request.formData();
  const productSlug = String(form.get('productSlug') ?? '').trim();
  const rating = Number(form.get('rating'));
  const title = String(form.get('title') ?? '').trim();
  const content = String(form.get('content') ?? '').trim();
  const imageUrlInput = String(form.get('imageUrl') ?? '').trim();
  const imageFile = form.get('imageFile');
  const clearImage = form.has('clearImage');

  const product = productSlug ? await getProductBySlug(productSlug) : undefined;
  if (!product) {
    return redirectResponse('/catalog?error=Product+not+found');
  }

  const redirectBase = `/products/${product.slug}`;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return redirectResponse(`${redirectBase}?error=Rating+must+be+between+1+and+5`);
  }
  if (!title || title.length > 120) {
    return redirectResponse(`${redirectBase}?error=Review+title+is+required+(max+120+chars)`);
  }
  if (!content || content.length > 2000) {
    return redirectResponse(`${redirectBase}?error=Review+content+is+required+(max+2000+chars)`);
  }

  let imageUrl: string | null | undefined = undefined;
  const existingReview = await getUserReviewForProduct(user.id, product.id);

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      if (existingReview?.imageUrl) deleteLocalReviewImage(existingReview.imageUrl);
      imageUrl = await saveReviewImageFile(user.id, imageFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      return redirectResponse(`${redirectBase}?error=${encodeURIComponent(msg)}`);
    }
  } else if (imageUrlInput) {
    const urlErr = validateReviewImageUrl(imageUrlInput);
    if (urlErr) return redirectResponse(`${redirectBase}?error=${encodeURIComponent(urlErr)}`);
    if (existingReview?.imageUrl?.startsWith('/uploads/reviews/')) {
      deleteLocalReviewImage(existingReview.imageUrl);
    }
    imageUrl = imageUrlInput;
  } else if (clearImage) {
    if (existingReview?.imageUrl) deleteLocalReviewImage(existingReview.imageUrl);
    imageUrl = null;
  }

  await upsertReview({
    productId: product.id,
    userId: user.id,
    rating,
    title,
    content,
    imageUrl,
  });

  await logEvent({
    eventType: EventType.REVIEW_SUBMIT,
    severity: 'info',
    message: `User "${user.username}" submitted a review for "${product.name}"`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { productId: product.id, productSlug: product.slug, rating },
  });

  return redirectResponse(`${redirectBase}?success=Review+submitted`);
};
