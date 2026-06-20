import { InvoiceDownloadLink } from "@/components/invoice/InvoiceDownloadLink";
import { formatPrice } from "@/lib/format";

export type OrderSummary = {
  id: string;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
};

type OrderHistoryProps = {
  orders: OrderSummary[];
};

export function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Purchase history</h2>
        <p className="mt-2 text-sm text-slate-400">
          Completed checkouts will appear here with downloadable PDF invoices.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
      <h2 className="text-lg font-semibold text-white">Purchase history</h2>
      <p className="mt-1 text-sm text-slate-400">
        Download PDF invoices for past simulated purchases.
      </p>
      <ul className="mt-6 space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-mono text-sm text-brand-300">{order.invoiceNumber}</p>
              <p className="mt-1 text-sm text-slate-400">
                {new Date(order.createdAt).toLocaleString("en-CA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-1 font-semibold text-white">
                {formatPrice(order.totalCents)}
              </p>
            </div>
            <InvoiceDownloadLink
              orderId={order.id}
              invoiceNumber={order.invoiceNumber}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
