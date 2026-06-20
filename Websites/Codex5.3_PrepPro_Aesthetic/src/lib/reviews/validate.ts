import { validateAvatarUrl } from "@/lib/auth/validation";

export function validateRating(rating: number): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Rating must be between 1 and 5 stars.";
  }
  return null;
}

export function validateComment(comment: string): string | null {
  const trimmed = comment.trim();
  if (trimmed.length < 10) {
    return "Review must be at least 10 characters.";
  }
  if (trimmed.length > 2000) {
    return "Review must be at most 2000 characters.";
  }
  return null;
}

export function validateReviewImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  return validateAvatarUrl(trimmed);
}
