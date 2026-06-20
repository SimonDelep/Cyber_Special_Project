import type { Product, ProductCategory } from "@prisma/client";

export type { Product, ProductCategory };

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  SERUM: "Facial Serums",
  NIGHT_CREAM: "Night Creams",
  EYE_PATCH: "Eye Patches",
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
