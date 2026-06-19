import type { CheckoutResult } from "../types/cart";
import { apiErrorMessage } from "./errors";

const API_BASE = "/api/v1";

export async function submitCheckout(
  items: { product_id: number; quantity: number }[]
): Promise<CheckoutResult> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      apiErrorMessage(res.status, data, "Checkout failed", {
        missingRouteHint:
          "Checkout is unavailable. Start the backend on port 8000 with the latest project code.",
      })
    );
  }
  return data as CheckoutResult;
}

export async function downloadInvoice(orderId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      apiErrorMessage(res.status, data, "Could not download invoice", {
        missingRouteHint:
          "Invoice download is unavailable. Restart the backend on port 8000 with the latest code.",
      })
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pureroots-invoice-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function formatMoney(amount: string | number): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    Number.isFinite(n) ? n : 0
  );
}
