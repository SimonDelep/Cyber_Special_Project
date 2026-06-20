import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullish(),
  content: z.string().trim().min(10, "Review must be at least 10 characters").max(2000),
  imageUrl: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.union([z.string().url("Invalid image URL"), z.null()]).optional(),
  ),
});

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(". ");
}
