import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  imageUrl: z.string().max(2048).optional().nullable(),
});
