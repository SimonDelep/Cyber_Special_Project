import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(100).optional().or(z.literal("")),
  content: z.string().min(10, "Review must be at least 10 characters").max(2000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
