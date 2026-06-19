import { apiRequest, apiUpload } from "./client";
import type { Review, ReviewCreatePayload } from "../types/review";

export function fetchProductReviews(productId: number) {
  return apiRequest<Review[]>(`/products/${productId}/reviews`);
}

export function createProductReview(productId: number, payload: ReviewCreatePayload) {
  return apiRequest<Review>(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function uploadReviewImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ image_url: string }>("/reviews/upload", formData);
}
