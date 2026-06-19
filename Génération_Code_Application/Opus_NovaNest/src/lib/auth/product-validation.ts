const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRODUCT_CATEGORIES = [
  'doorbell-cameras',
  'smart-lighting',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function validateProductSlug(slug: string): string | null {
  const value = slug.trim().toLowerCase();
  if (value.length < 2) return 'Slug must be at least 2 characters.';
  if (value.length > 64) return 'Slug must be 64 characters or less.';
  if (!SLUG_RE.test(value)) {
    return 'Slug may only contain lowercase letters, numbers, and hyphens.';
  }
  return null;
}

export function validateProductName(name: string): string | null {
  const value = name.trim();
  if (value.length < 1) return 'Product name is required.';
  if (value.length > 120) return 'Product name must be 120 characters or less.';
  return null;
}

export function validateProductDescription(description: string): string | null {
  const value = description.trim();
  if (value.length < 1) return 'Description is required.';
  if (value.length > 2000) return 'Description must be 2000 characters or less.';
  return null;
}

export function validateProductCategory(category: string): string | null {
  const value = category.trim();
  if (!PRODUCT_CATEGORIES.includes(value as ProductCategory)) {
    return `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`;
  }
  return null;
}

export function validateProductImage(image: string): string | null {
  const value = image.trim();
  if (!value) return 'Image path or URL is required.';
  if (value.startsWith('/')) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Image URL must use http or https.';
    }
  } catch {
    return 'Image must be a site path (e.g. /images/...) or a valid URL.';
  }
  return null;
}

export function validatePriceCents(priceCents: unknown): string | null {
  if (typeof priceCents !== 'number' || !Number.isInteger(priceCents)) {
    return 'Price must be a whole number of cents.';
  }
  if (priceCents < 0) return 'Price cannot be negative.';
  if (priceCents > 99_999_999) return 'Price is too large.';
  return null;
}

export function validateBalanceCents(balanceCents: unknown): string | null {
  if (typeof balanceCents !== 'number' || !Number.isInteger(balanceCents)) {
    return 'Balance must be a whole number of cents.';
  }
  if (balanceCents < 0) return 'Balance cannot be negative.';
  if (balanceCents > 99_999_999_99) return 'Balance is too large.';
  return null;
}
