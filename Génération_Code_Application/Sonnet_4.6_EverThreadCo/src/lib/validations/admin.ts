import { z } from "zod";

export const adminUserUpdateSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().max(64).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const adminBalanceAdjustSchema = z.object({
  mode: z.enum(["set", "add"]),
  amountCents: z.number().int(),
  note: z.string().max(200).optional(),
});

export const adminProductSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().url().max(2048).nullable().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  categoryId: z.string().min(1),
});

export const adminProductUpdateSchema = adminProductSchema.partial();
