import { z } from "zod";

export const adminUserUpdateSchema = z.object({
  displayName: z.string().trim().max(64).optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
  role: z.enum(["USER", "ADMIN"]).optional(),
  profileImageUrl: z
    .string()
    .trim()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  balanceCents: z.number().int().min(0).optional(),
});

export const balanceAdjustSchema = z.object({
  adjustmentCents: z.number().int(),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  priceCents: z.number().int().positive("Price must be greater than zero"),
  category: z.enum(["TUMBLER", "GLASSWARE", "WINE_MUG"]),
  imageUrl: z
    .string()
    .trim()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(". ");
}
