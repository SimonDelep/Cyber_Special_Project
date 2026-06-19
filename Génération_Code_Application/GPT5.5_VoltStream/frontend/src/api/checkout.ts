import { apiFetch, getToken } from "./client";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_cents: number;
}

export interface Order {
  id: number;
  total_cents: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export interface CheckoutResponse {
  order: Order;
  balance_cents: number;
}

export function placeCheckout(): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/api/checkout", { method: "POST" });
}

export function fetchOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/api/orders");
}

export function fetchOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`);
}

export async function downloadOrderInvoice(orderId: number): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`/api/orders/${orderId}/invoice`, { headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = (body as { detail?: unknown }).detail;
    throw new Error(typeof detail === "string" ? detail : "Could not download invoice");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gamergrid-invoice-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
