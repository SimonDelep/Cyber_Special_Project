import type { UserRole } from '@/db/schema';

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  profilePicture: string | null;
  role: UserRole;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUpdateUserInput {
  displayName?: string;
  email?: string;
  bio?: string;
  role?: UserRole;
  balance?: number;
  balanceDelta?: number;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  email?: string;
  bio?: string;
  profilePicture?: string | null;
  currentPassword?: string;
  newPassword?: string;
}
