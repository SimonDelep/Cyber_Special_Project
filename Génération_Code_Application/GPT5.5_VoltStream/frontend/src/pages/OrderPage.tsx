import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadOrderInvoice, fetchOrder, type Order } from "../api/checkout";
import { formatPrice } from "../api/products";
import { useAuth } from "../contexts/AuthContext";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchOrder(Number(id))
      .then(setOrder)
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [user, id]);

  if (authLoading || loading) {
    return <p className="py-24 text-center text-grid-muted">Loading order…</p>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Link to="/login" className="text-grid-cyan hover:underline">
          Sign in
        </Link>{" "}
        to view your order.
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-amber-400">{error ?? "Order not found"}</p>
        <Link to="/orders" className="mt-4 inline-block text-grid-cyan hover:underline">
          View all orders
        </Link>
      </section>
    );
  }

  const date = new Date(order.created_at).toLocaleString();

  const handleDownloadInvoice = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      await downloadOrderInvoice(order.id);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-2xl">✓</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Order confirmed</h1>
        <p className="mt-1 text-grid-muted">Order #{order.id} · {date}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-grid-border bg-grid-surface p-6">
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-grid-muted">
                {item.product_name} × {item.quantity}
              </span>
              <span className="text-white">{formatPrice(item.price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-grid-border pt-4">
          <span className="font-semibold text-white">Total paid</span>
          <span className="font-display text-xl font-bold text-grid-cyan">
            {formatPrice(order.total_cents)}
          </span>
        </div>
      </div>

      {downloadError && <p className="mt-4 text-center text-sm text-amber-400">{downloadError}</p>}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="rounded-xl border border-grid-cyan/50 bg-grid-cyan/10 px-6 py-3 font-semibold text-grid-cyan hover:bg-grid-cyan/20 disabled:opacity-50"
        >
          {downloading ? "Preparing PDF…" : "Download invoice (PDF)"}
        </button>
        <Link
          to="/orders"
          className="rounded-xl border border-grid-border px-6 py-3 font-semibold text-white hover:border-grid-cyan/50"
        >
          Order history
        </Link>
        <Link
          to="/#products"
          className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-6 py-3 font-semibold text-grid-dark"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
