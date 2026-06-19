export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ProfileUpdatePayload {
  email?: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  password?: string;
}
