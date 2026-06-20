import { validateAvatarUrl } from './validation';

export function validateReviewRating(rating: unknown): string | null {
  const value = typeof rating === 'number' ? rating : Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return 'Rating must be an integer from 1 to 5.';
  }
  return null;
}

export function validateReviewBody(body: string): string | null {
  const value = body.trim();
  if (value.length < 10) return 'Review must be at least 10 characters.';
  if (value.length > 2000) return 'Review must be 2000 characters or less.';
  return null;
}

export function validateReviewImageUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;
  return validateAvatarUrl(value);
}
