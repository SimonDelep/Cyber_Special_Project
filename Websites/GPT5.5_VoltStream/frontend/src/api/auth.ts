import { apiFetch, setToken } from "./client";

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  balance_cents: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function register(
  email: string,
  fullName: string,
  password: string
): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, full_name: fullName, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function fetchMe(): Promise<User> {
  return apiFetch<User>("/api/auth/me");
}

export function logout(): void {
  setToken(null);
}
