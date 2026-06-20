import type { Product } from "../types/product";
import type { SystemLogListResponse } from "../types/systemLog";
import type { User, UserRole } from "../types/user";
import { apiErrorMessage } from "./errors";

const API_BASE = "/api/v1/admin";

const ADMIN_UNAVAILABLE_HINT =
  "Cannot reach the admin API. Start the backend from the project folder: cd backend, then run .venv\\Scripts\\uvicorn app.main:app --host 127.0.0.1 --port 8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204 || res.status === 205) return undefined as T;

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(
      apiErrorMessage(res.status, data, "Admin request failed", {
        missingRouteHint: ADMIN_UNAVAILABLE_HINT,
      })
    );
  }
  return data as T;
}

export function listUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export function updateUser(
  userId: number,
  payload: {
    email?: string;
    full_name?: string;
    phone?: string;
    bio?: string;
    role?: UserRole;
    is_active?: boolean;
  }
): Promise<User> {
  return request<User>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateUserRole(userId: number, role: UserRole): Promise<User> {
  return request<User>(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function adjustBalance(
  userId: number,
  payload: { balance?: number; adjustment?: number }
): Promise<User> {
  const body =
    payload.balance !== undefined
      ? { balance: payload.balance }
      : { adjustment: payload.adjustment };
  return request<User>(`/users/${userId}/balance`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listProducts(): Promise<Product[]> {
  return request<Product[]>("/products");
}

export function createProduct(payload: {
  name: string;
  slug?: string;
  category: string;
  description: string;
  price: string;
  image_url?: string;
}): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  productId: number,
  payload: Partial<{
    name: string;
    slug: string;
    category: string;
    description: string;
    price: string;
    image_url: string;
  }>
): Promise<Product> {
  return request<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(productId: number): Promise<void> {
  return request<void>(`/products/${productId}`, { method: "DELETE" });
}

export interface ProductImportResult {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function importProductsFromCsv(file: File): Promise<ProductImportResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/products/csv-import`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      apiErrorMessage(res.status, data, "CSV import failed", {
        missingRouteHint:
          res.status === 405
            ? "CSV import is not available on this API server. Restart the backend on port 8000 with the latest code."
            : ADMIN_UNAVAILABLE_HINT,
      })
    );
  }
  return data as ProductImportResult;
}

export function fetchSystemLogs(params?: {
  limit?: number;
  offset?: number;
  event_type?: string;
  username?: string;
  success?: boolean;
}): Promise<SystemLogListResponse> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  if (params?.event_type) q.set("event_type", params.event_type);
  if (params?.username) q.set("username", params.username);
  if (params?.success !== undefined) q.set("success", String(params.success));
  const query = q.toString();
  return request<SystemLogListResponse>(`/logs${query ? `?${query}` : ""}`);
}

export function formatMoney(amount: string | number | undefined | null): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    Number.isFinite(n) ? n : 0
  );
}
