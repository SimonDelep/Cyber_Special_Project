"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/format";

export function CartPageClient() {
  const router = useRouter();
  const { status } = useSession();
  const {
    items,
    subtotalCents,
    hydrated,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const isLoggedIn = status === "authenticated";

  const loadBalance = useCallback(async () => {
    if (!isLoggedIn) {
      setBalanceCents(null);
      return;
    }
    setLoadingBalance(true);
    try {
      const res = await fetch("/api/account/balance");
      const data = await res.json();
      if (res.ok) {
        setBalanceCents(data.balanceCents as number);
      }
    } finally {
      setLoadingBalance(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  async function handleCheckout() {
    setError(null);
    setSuccess(null);
    setLastOrderId(null);

    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "INSUFFICIENT_FUNDS") {
          setBalanceCents(data.balanceCents as number);
          setError(
            `Insufficient balance. Your account has ${formatCents(data.balanceCents)}, but this order total is ${formatCents(data.totalCents)}.`,
          );
        } else {
          setError(
            data.error ??
              "Checkout failed. Try signing out and back in, or refresh the page.",
          );
        }
        return;
      }

      setBalanceCents(data.balanceCents as number);
      clearCart();
      setLastOrderId(data.orderId as string);
      setSuccess(
        `Order confirmed! ${formatCents(data.totalCents)} was deducted. Your new balance is ${formatCents(data.balanceCents)}.`,
      );
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (!hydrated) {
    return <p className="text-sm text-espresso/60">Loading cart…</p>;
  }

  if (items.length === 0 && success) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-sage/25 bg-linen p-10 text-center">
        <p className="font-display text-2xl text-espresso">Order confirmed</p>
        <div className="mt-6 text-left">
          <Alert variant="success">{success}</Alert>
        </div>
        {lastOrderId && (
          <Button
            href={`/api/orders/${lastOrderId}/invoice`}
            variant="secondary"
            className="mt-6 w-full"
          >
            Download invoice (PDF)
          </Button>
        )}
        <Button href="/catalog" className="mt-4 w-full">
          Continue shopping
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-sage/25 bg-cream/60 p-10 text-center">
        <p className="font-display text-xl text-espresso">Your cart is empty</p>
        <p className="mt-2 text-sm text-espresso/70">
          Browse our coffees and teas, then add items to your cart.
        </p>
        <Button href="/catalog" className="mt-6">
          Shop products
        </Button>
      </div>
    );
  }

  const canAfford =
    balanceCents !== null && balanceCents >= subtotalCents;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-sage/25 bg-cream/60 p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-linen">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-espresso to-sage-dark" />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <p className="font-medium text-espresso">{item.name}</p>
              <p className="text-sm text-espresso/60">
                {formatCents(item.priceCents)} each
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-espresso/80">
                  Qty
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(
                        item.productId,
                        parseInt(e.target.value, 10) || 1,
                      )
                    }
                    className="w-16 rounded-lg border border-sage/30 bg-cream px-2 py-1 text-espresso"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-semibold text-espresso">
              {formatCents(item.priceCents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-sage/25 bg-linen p-6">
        <h2 className="font-display text-xl text-espresso">Order summary</h2>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-espresso/70">Subtotal</dt>
            <dd className="font-medium text-espresso">
              {formatCents(subtotalCents)}
            </dd>
          </div>
          {isLoggedIn && (
            <div className="flex justify-between border-t border-sage/20 pt-3">
              <dt className="text-espresso/70">Account balance</dt>
              <dd className="font-medium text-espresso">
                {loadingBalance
                  ? "…"
                  : balanceCents !== null
                    ? formatCents(balanceCents)
                    : "—"}
              </dd>
            </div>
          )}
        </dl>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mt-4 space-y-3">
            <Alert variant="success">{success}</Alert>
            {lastOrderId && (
              <Button
                href={`/api/orders/${lastOrderId}/invoice`}
                variant="secondary"
                className="w-full"
              >
                Download invoice (PDF)
              </Button>
            )}
          </div>
        )}

        {!isLoggedIn && (
          <p className="mt-4 text-sm text-espresso/70">
            <Link href="/login?callbackUrl=/cart" className="text-sage-dark underline">
              Sign in
            </Link>{" "}
            to complete checkout with your account balance.
          </p>
        )}

        {isLoggedIn &&
          balanceCents !== null &&
          !canAfford &&
          !success && (
            <p className="mt-4 text-sm text-red-800">
              You need {formatCents(subtotalCents - balanceCents)} more in your
              account to complete this purchase.
            </p>
          )}

        <p className="mt-4 text-xs text-espresso/50">
          Simulated checkout — payment is deducted from your RoastRitual account
          balance (no card required).
        </p>

        {isLoggedIn ? (
          <Button
            type="button"
            className="mt-6 w-full"
            disabled={checkingOut || !!success}
            onClick={() => void handleCheckout()}
          >
            {checkingOut ? "Processing…" : "Complete checkout"}
          </Button>
        ) : (
          <Button href="/login?callbackUrl=/cart" className="mt-6 w-full">
            Sign in to checkout
          </Button>
        )}
      </aside>
    </div>
  );
}
