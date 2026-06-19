import { z } from "zod";

export const catalogQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.enum(["COFFEE", "TEA", "ALL"]).optional(),
  roastLevel: z.string().max(32).optional(),
  ethical: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["name", "price_asc", "price_desc"]).optional(),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
