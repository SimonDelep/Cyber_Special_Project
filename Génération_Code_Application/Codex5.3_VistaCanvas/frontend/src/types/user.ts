export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminUserUpdate {
  email?: string;
  full_name?: string | null;
  bio?: string | null;
  role?: UserRole;
  is_active?: boolean;
  balance?: number;
}

export interface SessionInfo {
  id: number;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}
