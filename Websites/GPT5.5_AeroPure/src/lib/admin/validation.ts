import { z } from "zod";
import { ProductCategory, Role } from "@prisma/client";

export const adminUserUpdateSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().max(50).optional().or(z.literal("")),
  role: z.nativeEnum(Role),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
});

export const balanceAdjustSchema = z.object({
  adjustment: z.coerce.number(),
  note: z.string().max(200).optional(),
});

export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.coerce.number().positive("Price must be positive"),
  category: z.nativeEnum(ProductCategory),
  featured: z.boolean().optional().default(false),
  inStock: z.boolean().optional().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
});

export const productUpdateSchema = productSchema.partial().extend({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const PRODUCT_CATEGORIES = [
  { value: ProductCategory.WIRELESS_CHARGING, label: "Wireless Charging" },
  { value: ProductCategory.SOLAR_POWER_BANK, label: "Solar Power Bank" },
  { value: ProductCategory.TRAVEL_ORGANIZER, label: "Travel Organizer" },
] as const;
