"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth/session";

interface CartViewProps {
  user: SafeUser | null;
}

export function CartView({ user }: CartViewProps) {
  const router = useRouter();
  const { items, total, isReady, removeItem, updateQuantity, clearCart } =
    useCart();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [balance, setBalance] = useState(user?.balance ?? null);

  async function handleDownloadInvoice() {
    if (!orderId) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${orderId}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Failed to download invoice");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber ?? "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download invoice. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleCheckout() {
    setError(null);
    setSuccess(null);
    setOrderId(null);
    setInvoiceNumber(null);

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/cart")}`);
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const outOfStock = items.find((item) => !item.inStock);
    if (outOfStock) {
      setError(`"${outOfStock.name}" is out of stock. Remove it to continue.`);
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Checkout failed. Please try again.");
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
        return;
      }

      clearCart();
      setBalance(data.balance);
      setOrderId(data.orderId ?? null);
      setInvoiceNumber(data.invoiceNumber ?? null);
      setSuccess(data.message ?? "Order placed successfully!");
      router.refresh();
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!isReady) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-stone">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl font-medium text-charcoal">
          Your cart
        </h1>
        <p className="mt-4 text-stone">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-8 inline-block text-sm font-medium text-ember transition-colors hover:text-ember-dark"
        >
          Continue shopping &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-medium text-charcoal">
        Your cart
      </h1>

      {success && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-charcoal"
        >
          {success}
          {invoiceNumber && (
            <span className="mt-1 block text-stone">
              Invoice: {invoiceNumber}
            </span>
          )}
          {balance !== null && (
            <span className="mt-1 block text-stone">
              Remaining balance: {formatPrice(balance)}
            </span>
          )}
          {orderId && (
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
              >
                {isDownloading ? "Preparing PDF..." : "Download invoice (PDF)"}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-10 space-y-6">
          <ul className="divide-y divide-stone/15 rounded-2xl border border-stone/15 bg-warm-white">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-stone">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-medium text-charcoal transition-colors hover:text-ember"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-stone">
                      {formatPrice(item.price)} each
                    </p>
                    {!item.inStock && (
                      <p className="mt-1 text-sm text-ember">Out of stock</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="flex items-center rounded-full border border-stone/20">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="px-3 py-1.5 text-stone transition-colors hover:text-charcoal"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      &minus;
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium text-charcoal">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      className="px-3 py-1.5 text-stone transition-colors hover:text-charcoal"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <p className="min-w-24 text-right font-medium text-charcoal">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from cart`}
                    className="text-sm text-stone transition-colors hover:text-ember"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-stone/15 bg-cream/50 p-6">
            <div className="flex items-center justify-between text-lg font-medium text-charcoal">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            {user ? (
              <p className="mt-2 text-sm text-stone">
                Account balance: {formatPrice(balance ?? user.balance)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-stone">
                <Link href="/login?redirect=/cart" className="text-ember hover:underline">
                  Sign in
                </Link>{" "}
                to complete your purchase.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || items.length === 0}
              >
                {isCheckingOut
                  ? "Processing..."
                  : user
                    ? "Place order"
                    : "Sign in to checkout"}
              </Button>
              <Button variant="secondary" onClick={clearCart} disabled={isCheckingOut}>
                Clear cart
              </Button>
            </div>

            <p className="mt-4 text-xs text-stone">
              This is a simulated checkout. Your account balance will be deducted
              if you have sufficient funds.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 && success && (
        <div className="mt-8 flex flex-wrap gap-4">
          {orderId && (
            <Button
              variant="secondary"
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
            >
              {isDownloading ? "Preparing PDF..." : "Download invoice (PDF)"}
            </Button>
          )}
          <Link
            href="/shop"
            className="inline-flex items-center text-sm font-medium text-ember transition-colors hover:text-ember-dark"
          >
            Continue shopping &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
