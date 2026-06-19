import { z } from "zod";
import { ProductCategory, Role } from "@prisma/client";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalImageUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Image must be a valid http(s) URL." },
  );

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email address.").optional().or(z.literal("")),
  role: z.nativeEnum(Role),
  profileImageUrl: optionalImageUrl,
});

export const adminAdjustBalanceSchema = z.object({
  userId: z.string().min(1),
  adjustmentDollars: z
    .string()
    .trim()
    .min(1, "Enter an adjustment amount.")
    .refine((value) => !Number.isNaN(Number(value)), "Must be a valid number."),
});

export const adminSetBalanceSchema = z.object({
  userId: z.string().min(1),
  balanceDollars: z
    .string()
    .trim()
    .min(1, "Enter a balance.")
    .refine((value) => {
      const n = Number(value);
      return !Number.isNaN(n) && n >= 0;
    }, "Balance must be zero or greater."),
});

const productBaseSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugRegex, "Slug must use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  category: z.nativeEnum(ProductCategory),
  priceDollars: z
    .string()
    .trim()
    .min(1, "Price is required.")
    .refine((value) => {
      const n = Number(value);
      return !Number.isNaN(n) && n > 0;
    }, "Price must be greater than zero."),
  imageUrl: optionalImageUrl,
  featured: z.boolean(),
  inStock: z.boolean(),
});

export const adminCreateProductSchema = productBaseSchema;
export const adminUpdateProductSchema = productBaseSchema.extend({
  productId: z.string().min(1),
});

export function dollarsToCents(dollars: string): number {
  return Math.round(Number(dollars) * 100);
}

export function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}
