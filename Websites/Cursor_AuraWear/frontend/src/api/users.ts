import { apiRequest, apiUpload } from "./client";
import type { ProfileUpdatePayload, User } from "../types/user";

export function fetchProfile() {
  return apiRequest<User>("/users/me");
}

export function updateProfile(payload: ProfileUpdatePayload) {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ avatar_url: string; user: User }>("/users/me/avatar", formData);
}

export function changePassword(current_password: string, new_password: string) {
  return apiRequest<void>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ current_password, new_password }),
  });
}

export function deleteAccount(password: string) {
  return apiRequest<void>("/users/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}
