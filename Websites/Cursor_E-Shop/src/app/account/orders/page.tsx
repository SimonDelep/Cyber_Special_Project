import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { formatBalance } from "@/lib/money";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Alert } from "@/components/ui/Alert";
import { InvoiceDownloadLink } from "@/components/orders/InvoiceDownloadLink";

interface OrdersPageProps {
  searchParams: Promise<{ placed?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await requireAuth();
  const { placed } = await searchParams;

  const ordersResult = await queryDb(() =>
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { select: { slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );
  const orders = ordersResult.data ?? [];

  return (
    <PageShell>
      <Link
        href="/account"
        className="text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Back to account
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">My orders</h1>
      <p className="mt-2 text-zinc-400">Order history and details.</p>

      {ordersResult.dbError ? (
        <div className="mt-6">
          <Alert>{ordersResult.dbError}</Alert>
        </div>
      ) : null}

      {placed ? (
        <div className="mt-6 space-y-4">
          <Alert variant="success">
            Order placed successfully! Thank you for shopping at E-Shop.
          </Alert>
          <InvoiceDownloadLink orderId={placed} />
        </div>
      ) : null}

      {!ordersResult.dbError && orders.length === 0 ? (
        <p className="mt-12 text-zinc-500">You have not placed any orders yet.</p>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">
                    {order.createdAt.toLocaleString("en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-600">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                  <div>
                    <p className="text-lg font-bold text-cyan-400">
                      {formatBalance(order.totalCents)}
                    </p>
                    <p className="mt-1 text-xs capitalize text-emerald-400/90">
                      {order.status.toLowerCase()}
                    </p>
                  </div>
                  <InvoiceDownloadLink orderId={order.id} />
                </div>
              </div>
              <ul className="mt-4 divide-y divide-zinc-800/80">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-zinc-200">
                      {item.productName}{" "}
                      <span className="text-zinc-500">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 text-zinc-400">
                      {formatBalance(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/shop"
        className="mt-10 inline-flex text-sm font-medium text-cyan-400 hover:text-cyan-300"
      >
        Continue shopping →
      </Link>
    </PageShell>
  );
}
