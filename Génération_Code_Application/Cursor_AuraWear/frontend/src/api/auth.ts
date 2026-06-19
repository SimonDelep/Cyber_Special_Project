import { apiRequest } from "./client";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/user";

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}

export function fetchCurrentUser() {
  return apiRequest<User>("/auth/me");
}
