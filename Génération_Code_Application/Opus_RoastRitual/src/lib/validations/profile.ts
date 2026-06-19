import { z } from "zod";

import { passwordSchema, usernameSchema } from "@/lib/validations/auth";

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  name: z.string().max(64).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  bio: z.string().max(500).optional().nullable(),
  image: z
    .string()
    .url("Invalid image URL")
    .max(2048)
    .optional()
    .nullable()
    .or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional().or(z.literal("")),
  confirmNewPassword: z.string().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
