import { z } from "zod";

export const adminUserUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  firstName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().max(50).optional().or(z.literal("")),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const balanceAdjustSchema = z.object({
  adjustment: z
    .number({ error: "Adjustment must be a number" })
    .refine((v) => v !== 0, "Adjustment cannot be zero"),
});

export const balanceSetSchema = z.object({
  balance: z
    .number({ error: "Balance must be a number" })
    .min(0, "Balance cannot be negative"),
});

export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().min(1, "Description is required").max(2000),
  price: z.number().positive("Price must be greater than 0"),
  category: z.enum(["CANDLES", "INCENSE_HOLDERS", "DIFFUSERS"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  name: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(2000).optional(),
});
