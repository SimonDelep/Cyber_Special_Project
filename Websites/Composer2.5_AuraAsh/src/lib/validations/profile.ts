import { z } from "zod";

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  firstName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().max(50).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  profilePicture: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
