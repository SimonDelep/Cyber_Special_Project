"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Product } from "../../../generated/prisma/client";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { InvoiceDownloadLink } from "@/components/invoice/InvoiceDownloadLink";
import { parseApiResponse } from "@/lib/parse-api-response";

type CartViewProps = {
  products: Product[];
  balanceCents: number;
  isLoggedIn: boolean;
};

export function CartView({ products, balanceCents: initialBalance, isLoggedIn }: CartViewProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [balanceCents, setBalanceCents] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    invoiceNumber: string;
  } | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo(() => {
    return items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          ...item,
          product,
          lineTotal: product.priceCents * item.quantity,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [items, productMap]);

  const totalCents = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const hasInsufficientBalance = isLoggedIn && balanceCents < totalCents;

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push("/login?next=/cart");
      return;
    }

    if (lines.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCompletedOrder(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Checkout failed");
        return;
      }

      const newBalance =
        (data.user as { balanceCents?: number } | undefined)?.balanceCents ?? balanceCents;
      setBalanceCents(newBalance);
      setSuccess((data.message as string) ?? "Order complete!");
      const order = data.order as { id: string; invoiceNumber: string } | undefined;
      if (order?.id && order.invoiceNumber) {
        setCompletedOrder(order);
      }
      clearCart();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !success && !completedOrder) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
        <p className="text-lg text-slate-300">Your cart is empty</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-400"
        >
          Browse products
        </Link>
      </div>
    );
  }

  if (completedOrder && items.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-500/30 bg-brand-950/30 p-8 text-center sm:p-12">
        <p className="text-lg font-semibold text-white">Order complete</p>
        {success ? (
          <p className="mt-2 text-sm text-brand-200">{success}</p>
        ) : null}
        <p className="mt-4 font-mono text-sm text-slate-400">
          Invoice {completedOrder.invoiceNumber}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <InvoiceDownloadLink
            orderId={completedOrder.id}
            invoiceNumber={completedOrder.invoiceNumber}
            className="inline-flex rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-400"
          />
          <Link
            href="/shop"
            className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-white/40"
          >
            Continue shopping
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          You can also download this invoice later from your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {lines.map((line) => (
          <article
            key={line.productId}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-semibold text-white">{line.product.name}</h3>
              <p className="text-sm text-slate-400">{formatPrice(line.product.priceCents)} each</p>
              {!line.product.inStock ? (
                <p className="mt-1 text-sm text-red-300">Out of stock</p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Qty
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={line.quantity}
                  onChange={(e) =>
                    updateQuantity(line.productId, Number.parseInt(e.target.value, 10) || 0)
                  }
                  className="w-16 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white"
                />
              </label>
              <p className="min-w-[5rem] text-right font-semibold text-white">
                {formatPrice(line.lineTotal)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(line.productId)}
                className="text-sm text-red-300 hover:text-red-200"
              >
                Remove
              </button>
            </div>
          </article>
        ))}

        {items.length > lines.length ? (
          <p className="text-sm text-amber-300">
            Some items in your cart are no longer available and were removed from this view.
          </p>
        ) : null}
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <dt>Subtotal</dt>
            <dd className="text-white">{formatPrice(totalCents)}</dd>
          </div>
          {isLoggedIn ? (
            <div className="flex justify-between text-slate-300">
              <dt>Your balance</dt>
              <dd className={hasInsufficientBalance ? "text-red-300" : "text-brand-300"}>
                {formatPrice(balanceCents)}
              </dd>
            </div>
          ) : null}
        </dl>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-200" role="status">
              {success}
            </p>
            {completedOrder ? (
              <InvoiceDownloadLink
                orderId={completedOrder.id}
                invoiceNumber={completedOrder.invoiceNumber}
                className="flex w-full justify-center rounded-full border border-brand-500/40 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-300 hover:bg-brand-500/20"
              />
            ) : null}
          </div>
        ) : null}

        {!isLoggedIn ? (
          <p className="mt-4 text-sm text-slate-400">
            <Link href="/login?next=/cart" className="text-brand-400 hover:text-brand-300">
              Sign in
            </Link>{" "}
            to complete checkout.
          </p>
        ) : hasInsufficientBalance && totalCents > 0 ? (
          <p className="mt-4 text-sm text-red-300">
            You need {formatPrice(totalCents - balanceCents)} more to complete this order.
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={
            loading ||
            lines.length === 0 ||
            lines.some((l) => !l.product.inStock) ||
            (isLoggedIn && hasInsufficientBalance)
          }
          className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Processing…"
            : !isLoggedIn
              ? "Sign in to checkout"
              : "Complete checkout (simulation)"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Simulation only — balance is deducted from your account.
        </p>
      </aside>
    </div>
  );
}
