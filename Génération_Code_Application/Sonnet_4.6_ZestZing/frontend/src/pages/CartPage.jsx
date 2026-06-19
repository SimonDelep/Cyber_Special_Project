import { useState } from "react";
import { Link } from "react-router-dom";
import { api, categoryLabel, formatMoney } from "../api/client";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { user, refreshUser } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastInvoice, setLastInvoice] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCheckout = async () => {
    setError("");
    setSuccess("");
    setLastInvoice(null);
    setCheckingOut(true);
    try {
      const result = await api.checkout(
        items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      );
      clearCart();
      await refreshUser();
      setLastInvoice({
        id: result.invoice_id,
        number: result.invoice_number,
      });
      setSuccess(
        `Order complete! Total ${formatMoney(result.total)}. ` +
          `New balance: ${formatMoney(result.new_balance)}.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!lastInvoice) return;
    setDownloading(true);
    try {
      await api.downloadInvoicePdf(lastInvoice.id, lastInvoice.number);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-4xl w-full px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-stone-900">Shopping Cart</h1>

        {success && (
          <div className="mt-6 rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3">
            <p>{success}</p>
            {lastInvoice && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span>
                  Invoice <strong>{lastInvoice.number}</strong> is ready.
                </span>
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {downloading ? "Preparing PDF…" : "Download invoice (PDF)"}
                </button>
              </div>
            )}
          </div>
        )}
        {error && (
          <p className="mt-6 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
        )}

        {items.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-stone-600">Your cart is empty.</p>
            <Link
              to="/catalog"
              className="mt-4 inline-block text-brand-600 font-semibold hover:text-brand-700"
            >
              Browse catalog →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-24 w-24 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-stone-200 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-stone-900">{item.name}</h2>
                    <p className="text-xs text-stone-500 capitalize">
                      {categoryLabel(item.category)}
                    </p>
                    <p className="mt-1 text-brand-700 font-semibold">
                      {formatMoney(item.price)}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-stone-600">
                        Qty
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                          }
                          className="ml-2 w-16 rounded border border-stone-300 px-2 py-1"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-stone-900 shrink-0">
                    {formatMoney(item.price * item.quantity)}
                  </p>
                </article>
              ))}
            </div>

            <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm h-fit sticky top-24">
              <h2 className="text-lg font-semibold text-stone-900">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-600">Subtotal</dt>
                  <dd className="font-semibold">{formatMoney(subtotal)}</dd>
                </div>
                {user && (
                  <div className="flex justify-between border-t border-stone-100 pt-2">
                    <dt className="text-stone-600">Your balance</dt>
                    <dd className="font-semibold">{formatMoney(user.balance)}</dd>
                  </div>
                )}
              </dl>
              {user && subtotal > Number(user.balance) && (
                <p className="mt-3 text-sm text-red-600">
                  Insufficient balance — you need {formatMoney(subtotal - Number(user.balance))} more.
                </p>
              )}

              {!user ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-stone-600">
                    Sign in to complete checkout with your account balance.
                  </p>
                  <Link
                    to="/login"
                    className="block w-full text-center rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
                  >
                    Sign in
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut || subtotal <= 0}
                  className="mt-6 w-full rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
                >
                  {checkingOut ? "Processing…" : "Complete checkout"}
                </button>
              )}

              <p className="mt-4 text-xs text-stone-500 text-center">
                Simulated checkout — balance is charged instantly.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
