import type { UserRole } from "@/db/schema";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  balanceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = AuthUser;
