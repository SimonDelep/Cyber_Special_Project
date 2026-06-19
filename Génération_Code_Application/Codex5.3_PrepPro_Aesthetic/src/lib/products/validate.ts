const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PRODUCT_CATEGORIES = ["meal-prep", "bento"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateSlug(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return "Slug must be lowercase letters, numbers, and hyphens.";
  }
  if (slug.length < 2 || slug.length > 80) {
    return "Slug must be 2–80 characters.";
  }
  return null;
}

export function validateProductInput(data: {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  priceCents?: number;
  imageUrl?: string;
  capacityMl?: number | null;
}): { ok: true } | { ok: false; error: string } {
  if (data.name !== undefined) {
    const n = data.name.trim();
    if (n.length < 2 || n.length > 120) {
      return { ok: false, error: "Name must be 2–120 characters." };
    }
  }
  if (data.slug !== undefined) {
    const err = validateSlug(data.slug.trim());
    if (err) return { ok: false, error: err };
  }
  if (data.description !== undefined) {
    if (data.description.trim().length < 10 || data.description.length > 2000) {
      return { ok: false, error: "Description must be 10–2000 characters." };
    }
  }
  if (data.category !== undefined) {
    if (!PRODUCT_CATEGORIES.includes(data.category as ProductCategory)) {
      return { ok: false, error: "Category must be meal-prep or bento." };
    }
  }
  if (data.priceCents !== undefined) {
    if (!Number.isInteger(data.priceCents) || data.priceCents < 0) {
      return { ok: false, error: "Price must be a non-negative integer (cents)." };
    }
  }
  if (data.imageUrl !== undefined) {
    const url = data.imageUrl.trim();
    if (!url.startsWith("/") && !url.startsWith("http")) {
      return { ok: false, error: "Image URL must be a path or http(s) URL." };
    }
  }
  if (data.capacityMl !== undefined && data.capacityMl !== null) {
    if (!Number.isInteger(data.capacityMl) || data.capacityMl < 0) {
      return { ok: false, error: "Capacity must be a non-negative integer (ml)." };
    }
  }
  return { ok: true };
}
