import { apiFetch, apiFetchForm } from "./client";
import type { Product } from "../types/product";

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  balance_cents: number;
  created_at: string;
}

export interface AdminUserUpdate {
  full_name?: string;
  email?: string;
  is_admin?: boolean;
  balance_cents?: number;
}

export interface ProductCreate {
  name: string;
  description: string;
  category: "keyboard" | "mouse" | "desk_mat";
  price_cents: number;
  image_url?: string | null;
}

export type ProductUpdate = Partial<ProductCreate>;

export function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/api/admin/users");
}

export function updateAdminUser(id: number, data: AdminUserUpdate): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function fetchAdminProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/admin/products");
}

export function createAdminProduct(data: ProductCreate): Promise<Product> {
  return apiFetch<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminProduct(id: number, data: ProductUpdate): Promise<Product> {
  return apiFetch<Product>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAdminProduct(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/products/${id}`, { method: "DELETE" });
}

export interface ProductImportResult {
  created: number;
  failed: number;
  errors: string[];
  created_names: string[];
}

export function importProductsCsv(file: File): Promise<ProductImportResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetchForm<ProductImportResult>("/api/admin/products/import", form);
}

export interface SystemLog {
  id: number;
  event_type: string;
  severity: string;
  message: string;
  success: boolean;
  actor_user_id: number | null;
  actor_email: string | null;
  target_user_id: number | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemLogQuery {
  limit?: number;
  offset?: number;
  event_type?: string;
  severity?: string;
}

export interface SystemLogListResponse {
  items: SystemLog[];
  total: number;
  limit: number;
  offset: number;
}

export function fetchAdminLogs(params: SystemLogQuery = {}): Promise<SystemLogListResponse> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.event_type) qs.set("event_type", params.event_type);
  if (params.severity) qs.set("severity", params.severity);
  const query = qs.toString();
  return apiFetch<SystemLogListResponse>(`/api/admin/logs${query ? `?${query}` : ""}`);
}
