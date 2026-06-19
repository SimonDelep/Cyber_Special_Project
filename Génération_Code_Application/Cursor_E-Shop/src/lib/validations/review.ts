import { z } from "zod";

const httpHttpsUrl = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must start with http:// or https://" }
  );

export const reviewImageUrlSchema = z.object({
  reviewImageUrl: httpHttpsUrl,
});

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = (v ?? "").trim();
      return trimmed === "" ? undefined : trimmed;
    })
    .refine((v) => v === undefined || v.length >= 3, {
      message: "Comment must be at least 3 characters",
    })
    .refine((v) => v === undefined || v.length <= 1000, {
      message: "Comment is too long (max 1000 characters)",
    }),
});
