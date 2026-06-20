import type {
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  User,
} from "../types/user";

const API_BASE = "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "API route not found. Restart the backend (uvicorn) so auth routes are loaded."
      );
    }
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ") || "Request failed"
          : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export function register(payload: RegisterPayload): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload): Promise<User> {
  return request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function fetchMe(): Promise<User> {
  return request<User>("/auth/me");
}

export function updateProfile(payload: ProfileUpdatePayload): Promise<User> {
  return request<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setAvatarUrl(avatarUrl: string): Promise<User> {
  return request<User>("/users/me/avatar-url", {
    method: "PUT",
    body: JSON.stringify({ avatar_url: avatarUrl }),
  });
}

export function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("file", file);
  return request<User>("/users/me/avatar", {
    method: "POST",
    body: form,
  });
}

export function deleteAccount(): Promise<void> {
  return request<void>("/auth/me", { method: "DELETE" });
}

export function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
}
