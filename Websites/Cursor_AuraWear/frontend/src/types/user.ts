export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUserUpdatePayload {
  email?: string;
  role?: UserRole;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface BalanceUpdatePayload {
  adjustment?: string;
  set_balance?: string;
  reason?: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ProfileUpdatePayload {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}
