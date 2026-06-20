import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categoryLabel, fetchProduct, formatPrice } from "../api/products";
import ProductReviews from "../components/ProductReviews";
import { useCart } from "../contexts/CartContext";

const categoryIcons: Record<string, string> = {
  keyboard: "⌨️",
  mouse: "🖱️",
  desk_mat: "🎨",
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [product, setProduct] = useState<Awaited<ReturnType<typeof fetchProduct>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productId = Number(id);
    if (!productId) {
      setError("Invalid product");
      setLoading(false);
      return;
    }
    fetchProduct(productId)
      .then(setProduct)
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    setMessage(null);
    try {
      await addItem(product.id);
      setMessage("Added to cart!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="py-24 text-center text-grid-muted">Loading product…</p>;
  }
  if (error || !product) {
    return (
      <div className="py-24 text-center">
        <p className="text-amber-400">{error ?? "Product not found"}</p>
        <Link to="/" className="mt-4 inline-block text-grid-cyan hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/#products" className="text-sm text-grid-muted hover:text-grid-cyan">
        ← Back to products
      </Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-2xl border border-grid-border bg-grid-surface p-8">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-8xl" role="img" aria-hidden>
              {categoryIcons[product.category] ?? "🎮"}
            </span>
          )}
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-grid-cyan">
            {categoryLabel(product.category)}
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold text-white">{product.name}</h1>
          <p className="mt-6 text-lg leading-relaxed text-grid-muted">{product.description}</p>
          <p className="mt-8 text-3xl font-bold text-white">{formatPrice(product.price_cents)}</p>
          {message && (
            <p className={`mt-4 text-sm ${message.includes("Added") ? "text-emerald-400" : "text-amber-400"}`}>
              {message}
            </p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="mt-6 rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3.5 font-semibold text-grid-dark transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </section>
  );
}
