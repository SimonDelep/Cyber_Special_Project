import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders, type Order } from "../api/checkout";
import { formatPrice } from "../api/products";
import { useAuth } from "../contexts/AuthContext";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <p className="py-24 text-center text-grid-muted">Loading orders…</p>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Link to="/login" className="text-grid-cyan hover:underline">
          Sign in
        </Link>{" "}
        to view order history.
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-white">No orders yet</h1>
        <p className="mt-3 text-grid-muted">Your completed purchases will appear here.</p>
        <Link
          to="/#products"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3 font-semibold text-grid-dark"
        >
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Order history</h1>
      <ul className="mt-10 space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-grid-border bg-grid-surface p-5 transition-colors hover:border-grid-cyan/40"
            >
              <div>
                <p className="font-display font-bold text-white">Order #{order.id}</p>
                <p className="text-sm text-grid-muted">
                  {new Date(order.created_at).toLocaleString()} · {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="font-bold text-grid-cyan">{formatPrice(order.total_cents)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
