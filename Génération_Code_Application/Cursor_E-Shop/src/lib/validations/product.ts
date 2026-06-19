import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  imageUrl: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = (v ?? "").trim();
      return trimmed === "" ? undefined : trimmed;
    })
    .refine((v) => v === undefined || z.string().url().safeParse(v).success, {
      message: "Invalid image URL",
    }),
  category: z.string().min(1, "Category is required"),
  stock: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export type ProductInput = z.infer<typeof productSchema>;
