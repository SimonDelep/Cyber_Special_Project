export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : { "Content-Type": "application/json", ...options.headers };

  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = data.detail || data.message || "Request failed";
    if (Array.isArray(message)) {
      message = message.map((e) => e.msg || e).join(", ");
    }
    const error = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (body) =>
    api("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    api("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  me: () => api("/api/auth/me"),
};

export const userApi = {
  getProfile: () => api("/api/users/me"),
  updateProfile: (body) =>
    api("/api/users/me", { method: "PUT", body: JSON.stringify(body) }),
  setPictureUrl: (profile_picture_url) =>
    api("/api/users/me/profile-picture-url", {
      method: "PUT",
      body: JSON.stringify({ profile_picture_url }),
    }),
  uploadPicture: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api("/api/users/me/profile-picture", { method: "POST", body: form });
  },
  deleteAccount: () => api("/api/users/me", { method: "DELETE" }),
};

export const externalApi = {
  gardenInsights: (location = "montreal") =>
    api(`/api/external/garden-insights?location=${location}`),
};

export const productApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v != null) qs.set(k, v);
    });
    const query = qs.toString();
    return api(`/api/products${query ? `?${query}` : ""}`);
  },
  categories: () => api("/api/products/categories"),
  getBySlug: (slug) => api(`/api/products/slug/${slug}`),
};

export const reviewApi = {
  list: (productId) => api(`/api/products/${productId}/reviews`),
  create: (productId, body) =>
    api(`/api/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (reviewId, body) =>
    api(`/api/reviews/${reviewId}`, { method: "PUT", body: JSON.stringify(body) }),
  setImageUrl: (reviewId, image_url) =>
    api(`/api/reviews/${reviewId}/image-url`, {
      method: "PUT",
      body: JSON.stringify({ image_url }),
    }),
  uploadImage: (reviewId, file) => {
    const form = new FormData();
    form.append("file", file);
    return api(`/api/reviews/${reviewId}/image`, { method: "POST", body: form });
  },
  delete: (reviewId) => api(`/api/reviews/${reviewId}`, { method: "DELETE" }),
};

export const checkoutApi = {
  placeOrder: (body) =>
    api("/api/checkout", { method: "POST", body: JSON.stringify(body) }),
};

export const invoiceApi = {
  list: () => api("/api/invoices"),
  downloadPdf: async (invoiceNumber) => {
    const response = await fetch(`/api/invoices/${invoiceNumber}/pdf`, {
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to download invoice");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sproutsoil-invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

export const adminApi = {
  listUsers: () => api("/api/admin/users"),
  getUser: (id) => api(`/api/admin/users/${id}`),
  updateUser: (id, body) =>
    api(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adjustBalance: (id, body) =>
    api(`/api/admin/users/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  listProducts: () => api("/api/admin/products"),
  createProduct: (body) =>
    api("/api/admin/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    api(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: "DELETE" }),
  importProductsCsv: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api("/api/admin/products/import-csv", { method: "POST", body: form });
  },
  listLogs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v != null) qs.set(k, String(v));
    });
    const query = qs.toString();
    return api(`/api/admin/logs${query ? `?${query}` : ""}`);
  },
};

export function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value));
}

export function avatarSrc(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
}
