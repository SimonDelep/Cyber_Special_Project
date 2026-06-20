import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function CartContent() {
  const { user, refreshUser } = useAuth();
  const { items, subtotal, setQuantity, removeItem, clearCart } = useCart();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderId: number;
    invoiceNumber: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!user) return null;

  const balance = Number(user.balance);

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLastOrder(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setBusy(true);
    try {
      const result = await api.checkout(
        items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      );
      await refreshUser();
      clearCart();
      setLastOrder({
        orderId: result.order_id,
        invoiceNumber: result.invoice_number,
      });
      setSuccess(
        `${result.message} Invoice ${result.invoice_number}. Charged $${Number(result.total_charged).toFixed(2)}. ` +
          `New balance: $${Number(result.balance).toFixed(2)}.`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
        <h1 className="font-display text-4xl text-mist">Shopping cart</h1>
        <p className="mt-2 text-mist/60">
          Account balance:{" "}
          <span className="font-medium text-gold">${balance.toFixed(2)}</span>
        </p>

        {success && (
          <div className="mt-6 rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            <p>{success}</p>
            {lastOrder && (
              <button
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    await api.downloadInvoice(
                      lastOrder.orderId,
                      lastOrder.invoiceNumber,
                    );
                  } catch (err) {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Invoice download failed",
                    );
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="mt-4 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-gold transition hover:bg-ink/80 disabled:opacity-50"
              >
                {downloading ? "Preparing PDF…" : "Download invoice (PDF)"}
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="mt-6 rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-mist/50">Your cart is empty.</p>
            <Link
              to="/#shop"
              className="mt-6 inline-block rounded-sm bg-gold px-6 py-3 text-sm font-medium text-ink transition hover:bg-gold/90"
            >
              Browse prints
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="mt-10 space-y-8">
            <ul className="divide-y divide-white/5 rounded-sm border border-white/5">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
                >
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-sm bg-deep">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-mist/30">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg text-gold">{item.name}</h2>
                    <p className="text-sm text-mist/50">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                      Quantity
                    </label>
                    <input
                      id={`qty-${item.productId}`}
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.productId, Number(e.target.value) || 1)
                      }
                      className="w-16 rounded-sm border border-white/10 bg-deep px-2 py-1 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-sm text-mist/50 transition hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-right font-medium text-gold sm:w-24">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="rounded-sm border border-white/5 bg-deep/50 p-6">
              <div className="flex justify-between text-lg">
                <span>Order total</span>
                <span className="font-medium text-gold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              {balance < subtotal && (
                <p className="mt-3 text-sm text-red-300">
                  Insufficient balance — you need $
                  {(subtotal - balance).toFixed(2)} more to complete this order.
                </p>
              )}
              <button
                type="submit"
                disabled={busy || balance < subtotal}
                className="mt-6 w-full rounded-sm bg-gold px-6 py-3 text-sm font-medium text-ink transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Processing…" : "Complete checkout (simulation)"}
              </button>
              <p className="mt-3 text-center text-xs text-mist/40">
                Simulated purchase — your account balance will be debited on
                success.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}
