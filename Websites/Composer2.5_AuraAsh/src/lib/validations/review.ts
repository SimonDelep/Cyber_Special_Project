import { z } from "zod";

export const reviewSchema = z.object({
  rating: z
    .number({ error: "Rating is required" })
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  title: z.string().max(120).optional().or(z.literal("")),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review cannot exceed 2000 characters"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
