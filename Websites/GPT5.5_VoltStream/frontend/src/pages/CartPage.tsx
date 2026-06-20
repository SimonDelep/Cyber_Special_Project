import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { loadGuestCart } from "../lib/guestCart";

const categoryIcons: Record<string, string> = {
  keyboard: "⌨️",
  mouse: "🖱️",
  desk_mat: "🎨",
};

export default function CartPage() {
  const { user } = useAuth();
  const { cart, guestProducts, loading, updateQuantity, removeItem } = useCart();
  const [guestEntries, setGuestEntries] = useState(loadGuestCart());

  useEffect(() => {
    if (!user) setGuestEntries(loadGuestCart());
  }, [user, cart, guestProducts]);

  if (loading && user) {
    return <p className="py-24 text-center text-grid-muted">Loading cart…</p>;
  }

  const serverItems = cart?.items ?? [];
  const guestItems = !user
    ? guestEntries
        .map((e) => {
          const product = guestProducts.get(e.product_id);
          if (!product) return null;
          return { ...e, product };
        })
        .filter(Boolean)
    : [];

  const items = user
    ? serverItems
    : guestItems.filter((x): x is NonNullable<typeof x> => x !== null);

  const totalCents = user
    ? (cart?.total_cents ?? 0)
    : items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);

  const balance = user?.balance_cents ?? 0;

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-3 text-grid-muted">Browse our gear and add something awesome.</p>
        <Link
          to="/#products"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3 font-semibold text-grid-dark"
        >
          Shop products
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Shopping cart</h1>
      {!user && (
        <p className="mt-2 text-sm text-grid-muted">
          <Link to="/login" state={{ from: "/checkout" }} className="text-grid-cyan hover:underline">
            Sign in
          </Link>{" "}
          to checkout with your account balance.
        </p>
      )}
      {user && (
        <p className="mt-2 text-sm text-grid-muted">
          Account balance: <span className="font-medium text-white">{formatPrice(balance)}</span>
        </p>
      )}
      <ul className="mt-10 space-y-4">
        {items.map((item) => (
          <li
            key={item.product_id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-grid-border bg-grid-surface p-5"
          >
            <span className="text-3xl">{categoryIcons[item.product.category] ?? "🎮"}</span>
            <div className="min-w-0 flex-1">
              <Link
                to={`/products/${item.product_id}`}
                className="font-display font-bold text-white hover:text-grid-cyan"
              >
                {item.product.name}
              </Link>
              <p className="text-sm text-grid-muted">{formatPrice(item.product.price_cents)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="h-8 w-8 rounded border border-grid-border text-white hover:border-grid-cyan"
              >
                −
              </button>
              <span className="w-8 text-center text-white">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                className="h-8 w-8 rounded border border-grid-border text-white hover:border-grid-cyan"
              >
                +
              </button>
            </div>
            <span className="font-bold text-white">
              {formatPrice(item.product.price_cents * item.quantity)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.product_id)}
              className="text-sm text-amber-400 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-grid-border pt-8">
        <div>
          <span className="text-lg text-grid-muted">Total</span>
          <p className="font-display text-2xl font-bold text-white">{formatPrice(totalCents)}</p>
        </div>
        {user ? (
          <Link
            to="/checkout"
            className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3.5 font-semibold text-grid-dark transition-opacity hover:opacity-90"
          >
            Proceed to checkout
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: "/checkout" }}
            className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3.5 font-semibold text-grid-dark"
          >
            Sign in to checkout
          </Link>
        )}
      </div>
      {user && balance < totalCents && (
        <p className="mt-4 text-center text-sm text-amber-400">
          Your balance is too low for this order. Contact an admin to add funds.
        </p>
      )}
    </section>
  );
}
