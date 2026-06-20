import { validateAvatarUrl } from '@/lib/auth/validation';

export type FieldErrors = Record<string, string>;

export function validateReviewInput(input: {
  rating?: number;
  title?: string;
  body?: string;
  imageUrl?: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (
    input.rating === undefined ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    errors.rating = 'Rating must be between 1 and 5.';
  }

  if (!input.body?.trim()) {
    errors.body = 'Review text is required.';
  } else if (input.body.length > 2000) {
    errors.body = 'Review must be 2000 characters or fewer.';
  }

  if (input.title !== undefined && input.title.length > 120) {
    errors.title = 'Title must be 120 characters or fewer.';
  }

  if (input.imageUrl !== undefined) {
    const err = validateAvatarUrl(input.imageUrl);
    if (err) errors.imageUrl = err;
  }

  return errors;
}
