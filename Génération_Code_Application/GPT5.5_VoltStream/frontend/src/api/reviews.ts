import { apiFetch, apiFetchForm } from "./client";

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewFormInput {
  rating: number;
  title: string;
  body: string;
  imageUrl?: string;
  imageFile?: File | null;
  clearImage?: boolean;
}

function buildReviewFormData(input: ReviewFormInput): FormData {
  const form = new FormData();
  form.append("rating", String(input.rating));
  form.append("title", input.title);
  form.append("body", input.body);
  if (input.clearImage) form.append("clear_image", "true");
  if (input.imageFile) {
    form.append("image_file", input.imageFile);
  } else if (input.imageUrl?.trim()) {
    form.append("image_url", input.imageUrl.trim());
  }
  return form;
}

export function fetchProductReviews(productId: number): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/products/${productId}/reviews`);
}

export function createProductReview(productId: number, input: ReviewFormInput): Promise<Review> {
  return apiFetchForm<Review>(
    `/api/products/${productId}/reviews`,
    buildReviewFormData(input),
    "POST"
  );
}

export function updateMyProductReview(productId: number, input: ReviewFormInput): Promise<Review> {
  return apiFetchForm<Review>(
    `/api/products/${productId}/reviews/mine`,
    buildReviewFormData(input),
    "PATCH"
  );
}

export function deleteMyProductReview(productId: number): Promise<void> {
  return apiFetch<void>(`/api/products/${productId}/reviews/mine`, { method: "DELETE" });
}

export function reviewImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/")) return url;
  return url;
}
