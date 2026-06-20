import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatMoney } from "../api/checkout";
import { fetchProductBySlug } from "../api/products";
import ReviewSection from "../components/ReviewSection";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";

const categoryLabels: Record<string, string> = {
  "oral-care": "Oral care",
  "personal-care": "Personal care",
  household: "Household",
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug)
      .then(setProduct)
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center text-stone-600">
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-stone-600">{error ?? "Product not found"}</p>
        <Link to="/catalog" className="mt-4 inline-block text-forest-600 hover:text-forest-700">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/catalog" className="text-sm font-medium text-forest-600 hover:text-forest-700">
        ← Back to catalog
      </Link>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-forest-50">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-6xl">🌿</div>
          )}
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-sage-500">
            {categoryLabels[product.category] ?? product.category}
          </span>
          <h1 className="font-display mt-2 text-3xl font-semibold text-forest-800">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-forest-700">{formatMoney(product.price)}</p>
          <p className="mt-6 leading-relaxed text-stone-600">{product.description}</p>
          <button
            type="button"
            onClick={() => {
              addItem(product);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            className="mt-8 rounded-full bg-forest-600 px-8 py-3 text-sm font-semibold text-white hover:bg-forest-700"
          >
            {added ? "Added to cart ✓" : "Add to cart"}
          </button>
        </div>
      </div>

      <ReviewSection productId={product.id} />
    </div>
  );
}
