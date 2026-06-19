import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { downloadInvoice, formatMoney, submitCheckout } from "../api/checkout";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  const balance = user ? Number(user.balance) : 0;
  const canAfford = user ? balance >= subtotal : false;

  async function handleDownloadInvoice() {
    if (!lastOrderId) return;
    setDownloadingInvoice(true);
    setError(null);
    try {
      await downloadInvoice(lastOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice download failed");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  async function handleCheckout() {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    if (items.length === 0) return;

    setCheckingOut(true);
    setError(null);
    setSuccess(null);
    setLastOrderId(null);

    try {
      const result = await submitCheckout(
        items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }))
      );
      clearCart();
      await refreshUser();
      setLastOrderId(result.order_id);
      setSuccess(
        `${result.message} Order #${result.order_id} — ${formatMoney(result.total)} charged. New balance: ${formatMoney(result.new_balance)}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  if (items.length === 0 && !success) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-forest-800">Your cart</h1>
        <p className="mt-4 text-stone-600">Your cart is empty.</p>
        <Link
          to="/#products"
          className="mt-8 inline-block rounded-full bg-forest-600 px-8 py-3 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-800">Your cart</h1>
      <p className="mt-2 text-stone-600">
        {itemCount} {itemCount === 1 ? "item" : "items"} — checkout uses your account balance.
      </p>

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
          <p className="font-medium">Order complete</p>
          <p className="mt-1">{success}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {lastOrderId && (
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
              >
                {downloadingInvoice ? "Preparing PDF…" : "Download invoice (PDF)"}
              </button>
            )}
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-forest-300 px-5 py-2 text-sm font-medium text-forest-700 hover:bg-forest-50"
            >
              Continue shopping →
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-medium">Checkout could not be completed</p>
          <p className="mt-1">{error}</p>
          {user && !canAfford && subtotal > 0 && (
            <p className="mt-2">
              Your balance is {formatMoney(balance)} but the order total is {formatMoney(subtotal)}.
              Ask an admin to add funds, or remove items from your cart.
            </p>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <ul className="space-y-4 lg:col-span-2">
            {items.map(({ product, quantity }) => (
              <li
                key={product.id}
                className="flex gap-4 rounded-2xl border border-forest-200/80 bg-white p-4 shadow-sm"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-forest-50">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🌿</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <h2 className="font-semibold text-forest-800">{product.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">{formatMoney(product.price)} each</p>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    <label className="flex items-center gap-2 text-sm text-stone-600">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={quantity}
                        onChange={(e) =>
                          updateQuantity(product.id, parseInt(e.target.value, 10) || 1)
                        }
                        className="w-16 rounded-lg border border-forest-200 px-2 py-1"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                    <span className="ml-auto font-semibold text-forest-700">
                      {formatMoney(Number(product.price) * quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-forest-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-forest-800">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="font-medium">{formatMoney(subtotal)}</dd>
              </div>
              {user && (
                <div className="flex justify-between border-t border-forest-100 pt-2">
                  <dt className="text-stone-600">Account balance</dt>
                  <dd className={canAfford ? "font-medium text-forest-700" : "font-medium text-red-600"}>
                    {formatMoney(balance)}
                  </dd>
                </div>
              )}
            </dl>

            {!user && (
              <p className="mt-4 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-800">
                <Link to="/login" state={{ from: "/cart" }} className="font-medium underline">
                  Sign in
                </Link>{" "}
                to complete checkout with your account balance.
              </p>
            )}

            {user && !canAfford && subtotal > 0 && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Insufficient balance. You need {formatMoney(subtotal - balance)} more.
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut || !user || items.length === 0 || (user && !canAfford)}
              className="mt-6 w-full rounded-full bg-forest-600 py-3 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingOut ? "Processing…" : "Complete checkout (simulation)"}
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">
              Simulated payment — balance is deducted instantly.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
