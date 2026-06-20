const API_BASE = "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = "Request failed";
    if (data.detail) {
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail))
        message = data.detail.map((d) => d.msg || String(d)).join(". ");
      else message = JSON.stringify(data.detail);
    }
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (body) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  updateProfile: (body) =>
    request("/api/users/me", { method: "PUT", body: JSON.stringify(body) }),
  setAvatarUrl: (profile_picture_url) =>
    request("/api/users/me/avatar-url", {
      method: "PUT",
      body: JSON.stringify({ profile_picture_url }),
    }),
  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/users/me/avatar", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || "Upload failed");
    }
    return data;
  },
  deleteProfile: () => request("/api/users/me", { method: "DELETE" }),
  listUsers: () => request("/api/admin/users"),
  getUser: (id) => request(`/api/admin/users/${id}`),
  updateUser: (id, body) =>
    request(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adjustBalance: (id, adjustment) =>
    request(`/api/admin/users/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify({ adjustment }),
    }),
  getQuotes: (limit = 3) => request(`/api/quotes?limit=${limit}`),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.min_price != null && params.min_price !== "")
      qs.set("min_price", params.min_price);
    if (params.max_price != null && params.max_price !== "")
      qs.set("max_price", params.max_price);
    if (params.sort) qs.set("sort", params.sort);
    const query = qs.toString();
    return request(`/api/products${query ? `?${query}` : ""}`);
  },
  getProduct: (id) => request(`/api/products/${id}`),
  getProductReviews: (productId) => request(`/api/products/${productId}/reviews`),
  createReview: (productId, body) =>
    request(`/api/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uploadReviewImage: async (productId, file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/products/${productId}/reviews/upload-image`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.detail === "string" ? data.detail : "Image upload failed",
      );
    }
    return data;
  },
  checkout: (items) =>
    request("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  listInvoices: () => request("/api/invoices"),
  downloadInvoicePdf: async (invoiceId, invoiceNumber) => {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to download invoice");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber || `invoice-${invoiceId}`}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  listProducts: () => request("/api/admin/products"),
  getProduct: (id) => request(`/api/admin/products/${id}`),
  createProduct: (body) =>
    request("/api/admin/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: "DELETE" }),
  downloadProductsImportSample: async () => {
    const res = await fetch("/api/admin/products/import/sample", { credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to download sample CSV");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_import_sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  importProductsCsv: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      let message = `Import failed (${res.status})`;
      if (data.detail) {
        message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      } else if (text && text.length < 500) {
        message = text;
      }
      throw new Error(message);
    }
    return data;
  },
  getEventLogs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.event_type) qs.set("event_type", params.event_type);
    if (params.status) qs.set("status", params.status);
    if (params.username) qs.set("username", params.username);
    if (params.limit) qs.set("limit", params.limit);
    if (params.offset) qs.set("offset", params.offset);
    const query = qs.toString();
    return request(`/api/admin/logs${query ? `?${query}` : ""}`);
  },
};

export const PRODUCT_CATEGORIES = [
  { value: "hot_sauce", label: "Gourmet Hot Sauce" },
  { value: "truffle_oil", label: "Truffle Oil" },
  { value: "spice_blend", label: "Spice Blend" },
];

export function categoryLabel(category) {
  return PRODUCT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

const CATEGORY_STYLES = {
  hot_sauce: "from-orange-500 to-red-600",
  truffle_oil: "from-amber-500 to-yellow-600",
  spice_blend: "from-stone-600 to-stone-800",
};

export function categoryAccent(category) {
  return CATEGORY_STYLES[category] ?? "from-brand-500 to-brand-700";
}

export function formatMoney(amount) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    Number(amount),
  );
}

export function avatarSrc(url) {
  if (!url) return null;
  return url;
}
