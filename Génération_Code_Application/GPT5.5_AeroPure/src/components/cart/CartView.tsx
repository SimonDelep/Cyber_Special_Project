"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { InvoiceDownload } from "@/components/orders/InvoiceDownload";
import { OrderHistory } from "@/components/orders/OrderHistory";
import type { ResolvedCart } from "@/lib/cart/types";
import { formatBalance, formatPrice } from "@/lib/utils";

type CartViewProps = {
  initialCart: ResolvedCart;
  initialBalance: number;
};

export function CartView({ initialCart, initialBalance }: CartViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [balance, setBalance] = useState(initialBalance);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);

  async function updateQuantity(productId: string, quantity: number) {
    setUpdatingId(productId);
    setError(null);

    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setCart(data.cart);
      router.refresh();
    } catch {
      setError("Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(productId: string) {
    setUpdatingId(productId);
    setError(null);

    try {
      const res = await fetch(`/api/cart/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Remove failed");
        return;
      }
      setCart(data.cart);
      router.refresh();
    } catch {
      setError("Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCheckout() {
    setError(null);
    setSuccess(null);
    setCheckingOut(true);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      setSuccess(data.message);
      setBalance(data.newBalance);
      setCart({ items: [], subtotal: 0, itemCount: 0 });
      if (data.orderId && data.orderNumber) {
        setLastOrder({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
        });
      }
      router.refresh();
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  const canAfford = balance >= cart.subtotal;
  const hasItems = cart.items.length > 0;

  return (
    <div className="space-y-8">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}
      {lastOrder && (
        <InvoiceDownload
          orderId={lastOrder.orderId}
          orderNumber={lastOrder.orderNumber}
        />
      )}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Account balance</p>
        <p className="mt-1 text-2xl font-bold text-accent">
          {formatBalance(balance)}
        </p>
      </div>

      {!hasItems ? (
        <div className="space-y-8">
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted">
              Browse our catalog and add items to get started.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Shop products
            </Link>
          </div>
          <OrderHistory />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {cart.items.map((item) => (
              <li
                key={item.productId}
                className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(item.price)} each
                    {!item.inStock && (
                      <span className="ml-2 text-red-600">· Out of stock</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={updatingId === item.productId}
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm hover:bg-border/50 disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={updatingId === item.productId}
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm hover:bg-border/50 disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className="min-w-[80px] text-right font-semibold">
                    {formatPrice(item.lineTotal)}
                  </p>
                  <button
                    type="button"
                    disabled={updatingId === item.productId}
                    onClick={() => removeItem(item.productId)}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Order total</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {!canAfford && (
              <p className="mt-3 text-sm text-red-600">
                Insufficient balance. You need{" "}
                {formatPrice(cart.subtotal - balance)} more to complete this
                order. Ask an admin to add funds, or remove items from your cart.
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut || !canAfford}
              className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingOut ? "Processing…" : "Simulate checkout"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              This is a simulated purchase. Your account balance will be debited
              on success.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
