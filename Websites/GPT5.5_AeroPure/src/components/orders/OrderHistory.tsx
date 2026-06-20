"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type OrderSummary = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  itemCount: number;
  createdAt: string;
};

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Loading orders…</p>;
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="font-semibold">Recent orders</h3>
      <ul className="mt-4 divide-y divide-border">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="font-mono text-sm">{order.orderNumber}</p>
              <p className="text-xs text-muted">
                {new Date(order.createdAt).toLocaleDateString("fr-CA")} ·{" "}
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatPrice(order.total)}</span>
              <a
                href={`/api/orders/${order.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent hover:underline"
              >
                PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
