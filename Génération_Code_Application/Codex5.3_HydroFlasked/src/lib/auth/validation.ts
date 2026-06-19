import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(usernameRegex, "Username must be 3–32 characters (letters, numbers, underscore)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().max(64).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().max(64).optional().nullable(),
  email: z.string().trim().email("Invalid email").optional().nullable().or(z.literal("")),
  profileImageUrl: z
    .string()
    .trim()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export const profileDeleteSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account"),
});

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(". ");
}
