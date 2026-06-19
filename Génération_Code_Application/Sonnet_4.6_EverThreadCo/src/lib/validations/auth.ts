import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(32, "Username must be at most 32 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Username may only contain lowercase letters, numbers, and underscores",
      ),
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    displayName: z.string().max(64).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().max(64).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().max(2048).optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional().or(z.literal("")),
  confirmNewPassword: z.string().optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account"),
});
