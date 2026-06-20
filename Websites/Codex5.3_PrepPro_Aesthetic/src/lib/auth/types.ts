import type { UserRole } from "@/db/schema";

export type PublicUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  balanceCents: number;
  createdAt: string;
};

/** Full user record for admin management (includes balance). */
export type AdminUserView = PublicUser & {
  balanceCents: number;
  updatedAt: string;
};

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USERNAME_TAKEN"
  | "EMAIL_TAKEN"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SERVER_ERROR";
