import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { placeCheckout } from "../api/checkout";
import { formatPrice } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function CheckoutPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading || cartLoading) {
    return <p className="py-24 text-center text-grid-muted">Preparing checkout…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  const items = cart?.items ?? [];
  const totalCents = cart?.total_cents ?? 0;
  const balance = user.balance_cents ?? 0;
  const canAfford = balance >= totalCents;

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-white">Nothing to checkout</h1>
        <p className="mt-3 text-grid-muted">Your cart is empty.</p>
        <Link to="/cart" className="mt-8 inline-block text-grid-cyan hover:underline">
          Back to cart
        </Link>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await placeCheckout();
      await refreshUser();
      await refreshCart();
      navigate(`/orders/${result.order.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>
      <p className="mt-2 text-grid-muted">Pay with your GamerGrid account balance.</p>

      <div className="mt-8 rounded-2xl border border-grid-border bg-grid-surface p-6">
        <h2 className="font-display text-lg font-bold text-white">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.product_id} className="flex justify-between text-sm">
              <span className="text-grid-muted">
                {item.product.name} × {item.quantity}
              </span>
              <span className="text-white">{formatPrice(item.product.price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-grid-border pt-4">
          <span className="font-semibold text-white">Total</span>
          <span className="font-display text-xl font-bold text-grid-cyan">{formatPrice(totalCents)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-grid-border bg-grid-surface/60 p-6">
        <div className="flex justify-between">
          <span className="text-grid-muted">Your balance</span>
          <span className="font-bold text-white">{formatPrice(balance)}</span>
        </div>
        {!canAfford && (
          <p className="mt-3 text-sm text-amber-400">
            Insufficient balance. Ask an admin to add funds, or remove items from your cart.
          </p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={submitting || !canAfford}
          className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3.5 font-semibold text-grid-dark disabled:opacity-50"
        >
          {submitting ? "Processing…" : `Pay ${formatPrice(totalCents)}`}
        </button>
        <Link
          to="/cart"
          className="rounded-xl border border-grid-border px-8 py-3.5 font-semibold text-white hover:border-grid-cyan/50"
        >
          Back to cart
        </Link>
      </form>
    </section>
  );
}
