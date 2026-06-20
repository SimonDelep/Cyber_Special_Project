import type { CheckoutResult } from "../types/cart";
import type { InspirationFeed } from "../types/inspiration";
import type { SystemEvent, SystemEventFilters } from "../types/systemEvent";
import type { Product, ProductInput, ProductSearchParams } from "../types/product";
import type { ProductImportResult } from "../types/productImport";
import type { Review, ReviewInput } from "../types/review";
import type { AdminUserUpdate, SessionInfo, User } from "../types/user";

const API_BASE = "/api";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
              .join(", ")
          : "Request failed";
    throw new ApiError(response.status, message);
  }

  return data as T;
}

function buildProductQuery(params: ProductSearchParams): string {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.category) qs.set("category", params.category);
  if (params.min_price != null) qs.set("min_price", String(params.min_price));
  if (params.max_price != null) qs.set("max_price", String(params.max_price));
  if (params.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const api = {
  getProducts: () => request<Product[]>("/products"),
  getInspiration: () => request<InspirationFeed>("/inspiration"),
  searchProducts: (params: ProductSearchParams = {}) =>
    request<Product[]>(`/products${buildProductQuery(params)}`),
  getProductCategories: () => request<string[]>("/products/categories"),
  getProductBySlug: (slug: string) => request<Product>(`/products/${slug}`),
  getProductReviews: (slug: string) => request<Review[]>(`/products/${slug}/reviews`),
  createProductReview: (slug: string, payload: ReviewInput) =>
    request<Review>(`/products/${slug}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProductReview: (
    slug: string,
    reviewId: number,
    payload: Partial<ReviewInput>,
  ) =>
    request<Review>(`/products/${slug}/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setReviewImageUrl: (slug: string, reviewId: number, image_url: string) =>
    request<Review>(`/products/${slug}/reviews/${reviewId}/image-url`, {
      method: "PUT",
      body: JSON.stringify({ image_url }),
    }),
  uploadReviewImage: (slug: string, reviewId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Review>(`/products/${slug}/reviews/${reviewId}/image`, {
      method: "POST",
      body: form,
    });
  },
  deleteProductReview: (slug: string, reviewId: number) =>
    request<void>(`/products/${slug}/reviews/${reviewId}`, { method: "DELETE" }),
  checkout: (items: { product_id: number; quantity: number }[]) =>
    request<CheckoutResult>("/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  downloadInvoice: async (orderId: number, invoiceNumber: string) => {
    const response = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = data.detail;
      const message =
        typeof detail === "string" ? detail : "Could not download invoice";
      throw new ApiError(response.status, message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  getMe: () => request<User>("/auth/me"),
  login: (username: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (payload: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  getSessions: () => request<SessionInfo[]>("/auth/sessions"),
  revokeSession: (sessionId: number) =>
    request<void>(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
  updateProfile: (payload: {
    email?: string;
    full_name?: string | null;
    bio?: string | null;
    password?: string;
  }) =>
    request<User>("/profile/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setAvatarUrl: (avatar_url: string) =>
    request<User>("/profile/me/avatar-url", {
      method: "PUT",
      body: JSON.stringify({ avatar_url }),
    }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<User>("/profile/me/avatar", {
      method: "POST",
      body: form,
    });
  },
  deleteAccount: (password: string) =>
    request<void>("/profile/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
  listSystemEvents: (filters: SystemEventFilters = {}) => {
    const qs = new URLSearchParams();
    if (filters.limit != null) qs.set("limit", String(filters.limit));
    if (filters.event_type) qs.set("event_type", filters.event_type);
    if (filters.status) qs.set("status", filters.status);
    if (filters.user_id != null) qs.set("user_id", String(filters.user_id));
    const query = qs.toString();
    return request<SystemEvent[]>(`/admin/events${query ? `?${query}` : ""}`);
  },
  listUsers: () => request<User[]>("/admin/users"),
  getUser: (id: number) => request<User>(`/admin/users/${id}`),
  updateUser: (id: number, payload: AdminUserUpdate) =>
    request<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  adjustBalance: (
    id: number,
    payload: { adjustment?: number; balance?: number },
  ) =>
    request<User>(`/admin/users/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listProducts: () => request<Product[]>("/admin/products"),
  downloadProductImportSample: async () => {
    const response = await fetch(
      `${API_BASE}/admin/products/import-csv/sample`,
      { credentials: "include" },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = data.detail;
      throw new ApiError(
        response.status,
        typeof detail === "string" ? detail : "Could not download sample CSV",
      );
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_import_sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  importProductsCsv: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ProductImportResult>("/admin/products/import-csv", {
      method: "POST",
      body: form,
    });
  },
  getProduct: (id: number) => request<Product>(`/admin/products/${id}`),
  createProduct: (payload: ProductInput) =>
    request<Product>("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: number, payload: Partial<ProductInput>) =>
    request<Product>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request<void>(`/admin/products/${id}`, { method: "DELETE" }),
};

export function resolveAvatarUrl(url: string | null): string | null {
  return resolveMediaUrl(url);
}

export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
}

export { ApiError };
