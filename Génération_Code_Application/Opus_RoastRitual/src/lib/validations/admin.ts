import { z } from "zod";

import { usernameSchema } from "@/lib/validations/auth";

export const adminUserUpdateSchema = z.object({
  username: usernameSchema.optional(),
  name: z.string().max(64).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  bio: z.string().max(500).nullable().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const balanceAdjustSchema = z.object({
  adjustmentCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .refine((n) => n !== 0, "Adjustment cannot be zero"),
  reason: z.string().max(200).optional(),
});

export const productSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(["COFFEE", "TEA"]),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  origin: z.string().max(80).nullable().optional(),
  roastLevel: z.string().max(40).nullable().optional(),
  isEthical: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const productCreateSchema = productSchema;

export const productUpdateSchema = productSchema.partial();
