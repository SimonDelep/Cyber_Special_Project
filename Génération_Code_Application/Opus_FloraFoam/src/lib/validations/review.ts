import { z } from "zod";

const optionalReviewImageUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/uploads/reviews/")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Image must be a valid http(s) URL or an uploaded file path." },
  );

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Review must be at least 10 characters.").max(2000),
  imageUrl: optionalReviewImageUrl,
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
