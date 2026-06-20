import { apiRequest, ApiError } from "./client";
import type { CartItem } from "../types/cart";

export interface CheckoutLineItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface CheckoutResponse {
  message: string;
  order_id: number;
  invoice_number: string;
  total: string;
  new_balance: string;
  items: CheckoutLineItem[];
}

export function checkout(items: CartItem[]) {
  return apiRequest<CheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify({
      items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    }),
  });
}

export async function downloadInvoice(orderId: number, invoiceNumber: string) {
  const response = await fetch(`/api/orders/${orderId}/invoice`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(
      response.status === 404 ? "Invoice not found" : "Could not download invoice",
      response.status,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
