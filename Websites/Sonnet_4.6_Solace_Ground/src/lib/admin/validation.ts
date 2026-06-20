import { USER_ROLES } from '@/db/schema';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_CATEGORIES = ['yoga-mat', 'cushion'] as const;

export type FieldErrors = Record<string, string>;

export function validateAdminUserUpdate(input: {
  username?: string;
  email?: string;
  role?: string;
  displayName?: string;
  bio?: string;
  balanceCents?: number;
  balanceAdjustmentCents?: number;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (input.username !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(input.username)) {
      errors.username = 'Username must be 3–32 characters (letters, numbers, underscore).';
    }
  }
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = 'Invalid email.';
  }
  if (input.role !== undefined && !USER_ROLES.includes(input.role as (typeof USER_ROLES)[number])) {
    errors.role = 'Role must be user or admin.';
  }
  if (input.displayName !== undefined && input.displayName.length > 80) {
    errors.displayName = 'Display name too long.';
  }
  if (input.bio !== undefined && input.bio.length > 500) {
    errors.bio = 'Bio too long.';
  }
  if (input.balanceCents !== undefined && (!Number.isInteger(input.balanceCents) || input.balanceCents < 0)) {
    errors.balanceCents = 'Balance must be a non-negative whole number of cents.';
  }
  if (
    input.balanceAdjustmentCents !== undefined &&
    !Number.isInteger(input.balanceAdjustmentCents)
  ) {
    errors.balanceAdjustmentCents = 'Adjustment must be a whole number of cents.';
  }

  return errors;
}

export function validateProductInput(input: {
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  priceCents?: number;
  imageUrl?: string | null;
  inStock?: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (input.slug !== undefined) {
    if (!SLUG_RE.test(input.slug)) {
      errors.slug = 'Slug must be lowercase letters, numbers, and hyphens.';
    }
  }
  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.name = 'Name is required.';
  }
  if (input.description !== undefined && input.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }
  if (
    input.category !== undefined &&
    !PRODUCT_CATEGORIES.includes(input.category as (typeof PRODUCT_CATEGORIES)[number])
  ) {
    errors.category = 'Category must be yoga-mat or cushion.';
  }
  if (
    input.priceCents !== undefined &&
    (!Number.isInteger(input.priceCents) || input.priceCents < 0)
  ) {
    errors.priceCents = 'Price must be a non-negative whole number of cents.';
  }
  if (input.imageUrl && !/^https?:\/\/.+/i.test(input.imageUrl)) {
    errors.imageUrl = 'Image URL must start with http:// or https://';
  }

  return errors;
}

export { PRODUCT_CATEGORIES };
