import { apiRequest, apiUpload } from "./client";
import type { BalanceUpdatePayload, AdminUserUpdatePayload, User } from "../types/user";
import type {
  Product,
  ProductCreatePayload,
  ProductImportResponse,
  ProductUpdatePayload,
} from "../types/product";
import type { EventLogFilters, SystemEventListResponse } from "../types/systemEvent";

function buildEventQuery(filters?: EventLogFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.event_type) params.set("event_type", filters.event_type);
  if (filters.success !== undefined) params.set("success", String(filters.success));
  if (filters.user_id) params.set("user_id", String(filters.user_id));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listEvents(filters?: EventLogFilters) {
  return apiRequest<SystemEventListResponse>(`/admin/events${buildEventQuery(filters)}`);
}

export function listUsers() {
  return apiRequest<User[]>("/admin/users");
}

export function updateUser(userId: number, payload: AdminUserUpdatePayload) {
  return apiRequest<User>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function adjustUserBalance(userId: number, payload: BalanceUpdatePayload) {
  return apiRequest<User>(`/admin/users/${userId}/balance`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listProducts() {
  return apiRequest<Product[]>("/admin/products");
}

export function createProduct(payload: ProductCreatePayload) {
  return apiRequest<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(productId: number, payload: ProductUpdatePayload) {
  return apiRequest<Product>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(productId: number) {
  return apiRequest<void>(`/admin/products/${productId}`, { method: "DELETE" });
}

export function importProductsFromCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ProductImportResponse>("/admin/products/import", formData);
}
