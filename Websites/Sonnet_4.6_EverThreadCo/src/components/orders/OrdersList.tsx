import Link from "next/link";
import { formatPrice } from "@/lib/format";

export type OrderListItem = {
  id: string;
  orderNumber: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
};

type OrdersListProps = {
  orders: OrderListItem[];
};

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 bg-cream-50 p-12 text-center">
        <p className="font-display text-2xl text-sand-900">No orders yet</p>
        <p className="mt-2 text-sm text-sand-600">
          Complete a simulated checkout to receive an invoice.
        </p>
        <Link
          href="/catalog"
          className="mt-8 inline-block rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-800"
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-cream-50">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-display text-lg text-sand-900">
              {order.orderNumber}
            </p>
            <p className="text-sm text-sand-600">
              {formatOrderDate(order.createdAt)} · {order.itemCount} item
              {order.itemCount === 1 ? "" : "s"} · {formatPrice(order.totalCents)}
            </p>
          </div>
          <a
            href={`/api/orders/${order.id}/invoice`}
            className="inline-flex items-center justify-center rounded-full border border-sage-600 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            Download invoice (PDF)
          </a>
        </li>
      ))}
    </ul>
  );
}
