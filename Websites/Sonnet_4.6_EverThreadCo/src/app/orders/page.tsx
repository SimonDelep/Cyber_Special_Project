import type { Metadata } from "next";
import { OrdersList } from "@/components/orders/OrdersList";
import { requireAuth } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/orders/server";

export const metadata: Metadata = {
  title: "Orders & invoices",
};

export default async function OrdersPage() {
  const session = await requireAuth();
  const rows = await listOrdersForUser(session.user.id);

  const orders = rows.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-sand-900">Orders & invoices</h1>
      <p className="mt-2 text-sm text-sand-600">
        Download PDF invoices for your simulated purchases.
      </p>
      <div className="mt-10">
        <OrdersList orders={orders} />
      </div>
    </div>
  );
}
