import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getCartSummary, lineTotalCents } from "@/lib/cart";
import { formatBalance } from "@/lib/money";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Alert } from "@/components/ui/Alert";
import { PlaceOrderForm } from "@/components/checkout/PlaceOrderForm";

export default async function CheckoutPage() {
  const session = await requireAuth();
  const checkoutResult = await queryDb(() =>
    Promise.all([
      getCartSummary(session.user.id),
      prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
        select: { balanceCents: true, name: true, email: true },
      }),
    ])
  );

  if (checkoutResult.dbError || !checkoutResult.data) {
    return (
      <PageShell narrow>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <div className="mt-6">
          <Alert>{checkoutResult.dbError ?? "Unable to load checkout."}</Alert>
        </div>
      </PageShell>
    );
  }

  const [{ items, totalCents }, user] = checkoutResult.data;

  const canAfford = user.balanceCents >= totalCents;
  const shortfall = totalCents - user.balanceCents;

  if (items.length === 0) {
    return (
      <PageShell narrow>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-4 text-zinc-400">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950"
        >
          Go to shop
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-2 text-zinc-400">Review your order and confirm with store credit.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-zinc-800">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-zinc-100">{item.product.name}</p>
                  <p className="text-sm text-zinc-500">Qty {item.quantity}</p>
                </div>
                <p className="shrink-0 font-medium text-zinc-200">
                  {formatBalance(
                    lineTotalCents(item.product.price, item.quantity)
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold">Payment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Order total</dt>
              <dd className="font-semibold text-zinc-100">
                {formatBalance(totalCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Your balance</dt>
              <dd className="font-semibold text-cyan-400">
                {formatBalance(user.balanceCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-3">
              <dt className="text-zinc-400">Balance after order</dt>
              <dd
                className={
                  canAfford ? "font-semibold text-emerald-400" : "font-semibold text-red-400"
                }
              >
                {formatBalance(user.balanceCents - totalCents)}
              </dd>
            </div>
          </dl>

          {!canAfford ? (
            <div className="mt-4">
              <Alert>
                You need {formatBalance(shortfall)} more store credit. Ask an admin to
                top up your account.
              </Alert>
            </div>
          ) : null}

          <PlaceOrderForm canAfford={canAfford} />

          <Link
            href="/cart"
            className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Back to cart
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
