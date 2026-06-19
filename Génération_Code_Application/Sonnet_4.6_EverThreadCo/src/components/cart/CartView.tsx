"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { CartSummary } from "@/lib/cart/types";

type CompletedOrder = {
  id: string;
  orderNumber: string;
  totalCents: number;
};

type CartViewProps = {
  initialCart: CartSummary;
  initialBalanceCents: number;
};

export function CartView({ initialCart, initialBalanceCents }: CartViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [balanceCents, setBalanceCents] = useState(initialBalanceCents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  const canAfford = balanceCents >= cart.subtotalCents;
  const shortfall = cart.subtotalCents - balanceCents;

  async function updateQuantity(productId: string, quantity: number) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/cart/items/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }

    setCart(data.cart);
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }

  async function removeItem(productId: string) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/cart/items/${productId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Remove failed");
      return;
    }

    setCart(data.cart);
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 402) {
        setError(
          `Insufficient balance. You need ${formatPrice(data.totalCents)} but only have ${formatPrice(data.balanceCents)} (${formatPrice(data.shortfallCents)} short).`,
        );
        setBalanceCents(data.balanceCents);
        return;
      }
      setError(data.error ?? "Checkout failed");
      return;
    }

    setCart({ items: [], itemCount: 0, subtotalCents: 0 });
    setBalanceCents(data.balanceCents);
    setCompletedOrder({
      id: data.orderId,
      orderNumber: data.orderNumber,
      totalCents: data.totalCents,
    });
    setSuccess(
      `Order simulated successfully! ${formatPrice(data.totalCents)} charged. New balance: ${formatPrice(data.balanceCents)}.`,
    );
    window.dispatchEvent(new CustomEvent("cart-updated"));
    router.refresh();
  }

  if (cart.items.length === 0 && completedOrder) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-cream-50 p-10 text-center">
        <p className="font-display text-2xl text-sand-900">Order complete</p>
        {success ? (
          <p className="mt-3 text-sm text-sage-800">{success}</p>
        ) : null}
        <p className="mt-2 text-sm text-sand-600">
          Invoice {completedOrder.orderNumber}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`/api/orders/${completedOrder.id}/invoice`}
            className="inline-flex items-center justify-center rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-800"
          >
            Download invoice (PDF)
          </a>
          <Button href="/orders" variant="secondary">
            View all orders
          </Button>
        </div>
        <Link
          href="/catalog"
          className="mt-6 block text-sm text-sage-700 hover:text-sage-900"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 bg-cream-50 p-12 text-center">
        <p className="font-display text-2xl text-sand-900">Your cart is empty</p>
        <p className="mt-2 text-sm text-sand-600">
          Browse our essentials and add items to get started.
        </p>
        <Button href="/#shop" className="mt-8">
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-cream-50">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-display text-lg text-sand-900">{item.name}</h3>
                <p className="text-sm text-sand-600">
                  {formatPrice(item.priceCents)} each
                </p>
                {!item.inStock ? (
                  <p className="mt-1 text-xs text-red-700">Out of stock</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor={`qty-${item.productId}`} className="sr-only">
                    Quantity
                  </label>
                  <button
                    type="button"
                    disabled={loading || item.quantity <= 1}
                    onClick={() =>
                      void updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 text-sand-800 hover:bg-cream-100 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span
                    id={`qty-${item.productId}`}
                    className="min-w-8 text-center text-sm font-medium"
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={loading || item.quantity >= 99}
                    onClick={() =>
                      void updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 text-sand-800 hover:bg-cream-100 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-semibold text-sand-900">
                  {formatPrice(item.lineTotalCents)}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void removeItem(item.productId)}
                  className="text-sm text-red-700 hover:text-red-900"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded-2xl border border-sand-200 bg-cream-50 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-sand-900">Order summary</h2>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between text-sand-700">
            <dt>Items ({cart.itemCount})</dt>
            <dd>{formatPrice(cart.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-sand-200 pt-3 font-medium text-sand-900">
            <dt>Total</dt>
            <dd>{formatPrice(cart.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-sand-600">
            <dt>Account balance</dt>
            <dd>{formatPrice(balanceCents)}</dd>
          </div>
        </dl>

        {!canAfford && cart.subtotalCents > 0 ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            Insufficient balance. You need {formatPrice(shortfall)} more to
            complete this purchase.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-800">
            <p>{success}</p>
            {completedOrder ? (
              <a
                href={`/api/orders/${completedOrder.id}/invoice`}
                className="mt-3 inline-block font-medium text-sage-900 underline hover:no-underline"
              >
                Download invoice (PDF) — {completedOrder.orderNumber}
              </a>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={loading || !canAfford}
          onClick={() => void handleCheckout()}
        >
          {loading ? "Processing…" : "Complete checkout (simulated)"}
        </Button>

        <p className="mt-4 text-xs text-sand-500">
          Simulated checkout charges your EverThread account balance. No real
          payment is processed.
        </p>

        <Link
          href="/#shop"
          className="mt-4 block text-center text-sm text-sage-700 hover:text-sage-900"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
