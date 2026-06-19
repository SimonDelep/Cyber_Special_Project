import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const adminUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["CUSTOMER", "ADMIN"]),
  balanceCents: z.coerce.number().int().min(0, "Balance cannot be negative"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
