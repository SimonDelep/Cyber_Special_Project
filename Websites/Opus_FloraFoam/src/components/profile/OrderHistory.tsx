import { formatPrice } from "@/types/product";

export type OrderSummary = {
  id: string;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
};

type OrderHistoryProps = {
  orders: OrderSummary[];
};

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <section className="mt-10 rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
        <h2 className="font-display text-lg font-semibold text-sage-900">Purchase history</h2>
        <p className="mt-2 text-sm text-sage-600">
          Completed orders and invoices will appear here after checkout.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
      <h2 className="font-display text-lg font-semibold text-sage-900">Purchase history</h2>
      <p className="mt-1 text-sm text-sage-600">Download PDF invoices for past purchases.</p>
      <ul className="mt-4 divide-y divide-sage-200/80">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-sage-900">{order.invoiceNumber}</p>
              <p className="text-sm text-sage-600">
                {formatOrderDate(order.createdAt)} · {formatPrice(order.totalCents)}
              </p>
            </div>
            <a
              href={`/api/invoices/${order.id}`}
              download
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50"
            >
              Download PDF
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
