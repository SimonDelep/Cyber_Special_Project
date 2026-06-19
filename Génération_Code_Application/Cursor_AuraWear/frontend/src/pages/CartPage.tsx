import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as checkoutApi from "../api/checkout";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: number;
    invoiceNumber: string;
  } | null>(null);

  async function handleCheckout() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    if (items.length === 0) return;

    setCheckingOut(true);
    setError("");
    setSuccess("");
    setCompletedOrder(null);
    try {
      const result = await checkoutApi.checkout(items);
      clearCart();
      await refreshUser();
      setCompletedOrder({ orderId: result.order_id, invoiceNumber: result.invoice_number });
      setSuccess(
        `${result.message} Invoice ${result.invoice_number}. Total charged: ${formatCurrency(result.total)}. New balance: ${formatCurrency(result.new_balance)}.`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleDownloadInvoice() {
    if (!completedOrder) return;
    setDownloadingInvoice(true);
    setError("");
    try {
      await checkoutApi.downloadInvoice(completedOrder.orderId, completedOrder.invoiceNumber);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  const balance = user ? parseFloat(user.balance) : 0;
  const canAfford = isAuthenticated && balance >= subtotal;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-aura-950">Shopping cart</h1>
      <p className="mt-2 text-sm text-aura-600">
        {itemCount === 0 ? "Your cart is empty." : `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
      </p>

      {success && (
        <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          <p>{success}</p>
          {completedOrder && (
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="mt-3 inline-flex rounded-full bg-aura-950 px-5 py-2 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
            >
              {downloadingInvoice ? "Preparing PDF…" : "Download invoice (PDF)"}
            </button>
          )}
          <p className="mt-3">
            <Link to="/" className="font-semibold underline">
              Continue shopping
            </Link>
          </p>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 && !success ? (
        <div className="mt-10 text-center">
          <Link
            to="/#shop"
            className="inline-flex rounded-full bg-aura-950 px-6 py-3 text-sm font-semibold text-aura-50 hover:bg-aura-800"
          >
            Browse products
          </Link>
        </div>
      ) : (
        items.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <ul className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex gap-4 rounded-2xl border border-aura-200 bg-white p-4 shadow-sm"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-aura-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-aura-200" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-aura-950">{item.name}</h2>
                    <p className="text-sm text-aura-600">{formatCurrency(item.price)} each</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-lg border border-aura-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-1 text-aura-700 hover:bg-aura-50"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] px-2 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1 text-aura-700 hover:bg-aura-50 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-aura-950">
                    {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="h-fit rounded-2xl border border-aura-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-aura-950">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-aura-600">Subtotal</dt>
                  <dd className="font-medium text-aura-950">{formatCurrency(subtotal)}</dd>
                </div>
                {isAuthenticated && user && (
                  <div className="flex justify-between border-t border-aura-100 pt-2">
                    <dt className="text-aura-600">Wallet balance</dt>
                    <dd className="font-medium text-aura-950">{formatCurrency(user.balance)}</dd>
                  </div>
                )}
              </dl>

              {isAuthenticated && subtotal > 0 && !canAfford && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Insufficient balance. You need {formatCurrency(subtotal - balance)} more to complete
                  this purchase.
                </p>
              )}

              {!isAuthenticated && (
                <p className="mt-4 text-xs text-aura-600">
                  <Link to="/login" state={{ from: "/cart" }} className="font-semibold text-aura-800">
                    Sign in
                  </Link>{" "}
                  to checkout with your wallet balance.
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
                className="mt-6 w-full rounded-full bg-aura-950 py-3 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
              >
                {checkingOut
                  ? "Processing…"
                  : isAuthenticated
                    ? "Complete checkout"
                    : "Sign in to checkout"}
              </button>
              <p className="mt-3 text-center text-xs text-aura-500">
                Simulated checkout — balance is debited instantly.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
