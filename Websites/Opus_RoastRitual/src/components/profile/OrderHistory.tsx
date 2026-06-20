import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/format";

export type OrderSummary = {
  id: string;
  totalCents: number;
  createdAt: Date;
};

type OrderHistoryProps = {
  orders: OrderSummary[];
};

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(date);
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-espresso/60">
        No purchases yet. Complete a checkout on the cart page to receive an
        invoice.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage/25 bg-cream/60 px-4 py-3"
        >
          <div>
            <p className="font-medium text-espresso">
              {formatCents(order.totalCents)}
            </p>
            <p className="text-xs text-espresso/60">
              {formatOrderDate(order.createdAt)} · #
              {order.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <Button
            href={`/api/orders/${order.id}/invoice`}
            variant="secondary"
            className="!px-4 !py-2 text-sm"
          >
            Download PDF
          </Button>
        </li>
      ))}
    </ul>
  );
}
