import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, categoryLabel, formatMoney } from "../api/client";
import Navbar from "../components/Navbar";
import ReviewSection from "../components/ReviewSection";
import { useCart } from "../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <p className="text-center py-20 text-stone-500">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="text-red-600">{error || "Product not found"}</p>
          <Link to="/catalog" className="mt-4 inline-block text-brand-600 font-semibold">
            ← Back to catalog
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <Link to="/catalog" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Back to catalog
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-stone-200" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {categoryLabel(product.category)}
            </p>
            <h1 className="font-display text-4xl font-bold text-stone-900 mt-2">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-bold text-brand-700">
              {formatMoney(product.price)}
            </p>
            <p className="mt-6 text-stone-600 leading-relaxed">{product.description}</p>
            <button
              type="button"
              onClick={() => {
                addItem(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className="mt-8 rounded-full bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              {added ? "Added to cart ✓" : "Add to cart"}
            </button>
          </div>
        </div>

        <ReviewSection productId={product.id} />
      </main>
    </div>
  );
}
