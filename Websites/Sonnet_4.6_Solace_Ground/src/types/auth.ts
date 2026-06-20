import type { UserRole } from '@/db/schema';

export type PublicUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
};

export function toPublicUser(user: {
  id: number;
  username: string;
  email: string;
  role: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  balanceCents?: number | null;
  createdAt: string;
  updatedAt: string;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    balanceCents: user.balanceCents ?? 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
