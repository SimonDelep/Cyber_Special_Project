import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkoutApi, formatMoney, invoiceApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    if (items.length === 0) return;

    setCheckingOut(true);
    setError("");
    setSuccess("");

    try {
      const result = await checkoutApi.placeOrder({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      });
      updateUser(result.user);
      clearCart();
      setInvoiceNumber(result.invoice_number);
      setSuccess(
        `${result.message} Total charged: ${formatMoney(result.total)}. ` +
          `New balance: ${formatMoney(result.new_balance)}. ` +
          `Invoice: ${result.invoice_number}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-soil-950">
          Your cart is empty
        </h1>
        <p className="mt-2 text-soil-600">
          Browse our indoor gardening essentials and add something you love.
        </p>
        <Link
          to="/#products"
          className="mt-8 inline-block rounded-full bg-sprout-500 px-8 py-3 text-sm font-semibold text-white hover:bg-sprout-600"
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-soil-950">
        Shopping cart
      </h1>
      <p className="mt-2 text-soil-600">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
      </p>

      {success && (
        <div className="mt-6 rounded-2xl bg-sprout-500/10 px-5 py-4 ring-1 ring-sprout-500/20">
          <p className="font-medium text-sprout-800">Order complete</p>
          <p className="mt-1 text-sm text-sprout-700">{success}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {invoiceNumber && (
              <button
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    await invoiceApi.downloadPdf(invoiceNumber);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="rounded-full bg-soil-800 px-5 py-2 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
              >
                {downloading ? "Downloading…" : "Download invoice (PDF)"}
              </button>
            )}
            <Link
              to="/catalog"
              className="inline-flex items-center rounded-full border border-soil-200 px-5 py-2 text-sm font-medium text-soil-700 hover:bg-soil-100"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <article
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-soil-200 bg-white p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soil-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl">
                      🌿
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-soil-900">{item.name}</h2>
                    <p className="text-sm text-soil-500">
                      {formatMoney(item.price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-soil-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1.5 text-soil-600 hover:bg-soil-50"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1.5 text-soil-600 hover:bg-soil-50"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <p className="min-w-[5rem] text-right font-semibold text-soil-900">
                      {formatMoney(Number(item.price) * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-soil-200 bg-soil-50 p-6">
            <h2 className="font-display text-lg font-bold text-soil-900">
              Order summary
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-soil-600">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-soil-200 pt-2 text-base font-bold text-soil-900">
                <span>Total</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>

            {user ? (
              <p className="mt-4 text-sm text-soil-600">
                Account balance:{" "}
                <span className="font-semibold text-sprout-600">
                  {formatMoney(user.balance ?? 0)}
                </span>
              </p>
            ) : (
              <p className="mt-4 text-sm text-soil-500">
                <Link to="/login" state={{ from: "/cart" }} className="text-sprout-600 hover:underline">
                  Sign in
                </Link>{" "}
                to complete checkout.
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut || items.length === 0}
              className="mt-6 w-full rounded-full bg-sprout-500 py-3 text-sm font-semibold text-white hover:bg-sprout-600 disabled:opacity-60"
            >
              {checkingOut
                ? "Processing…"
                : user
                  ? "Place order"
                  : "Sign in to checkout"}
            </button>

            <p className="mt-3 text-center text-xs text-soil-500">
              Simulated checkout — balance is deducted on success.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
