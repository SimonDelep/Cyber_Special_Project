import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct } from "../api/products";
import ReviewSection from "../components/ReviewSection";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/format";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const id = Number(productId);
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Invalid product.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="aspect-[4/5] max-w-lg animate-pulse rounded-2xl bg-aura-200/60" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-aura-600">{error || "Product not found."}</p>
        <Link to="/catalog" className="mt-4 inline-block font-semibold text-aura-800 hover:text-aura-950">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/catalog" className="text-sm font-medium text-aura-600 hover:text-aura-950">
          ← Back to catalog
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-aura-200 bg-aura-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-aura-200 to-aura-300 text-aura-600">
                No image
              </div>
            )}
          </div>

          <div>
            <span className="rounded-full bg-aura-100 px-3 py-1 text-xs font-semibold capitalize text-aura-800">
              {product.category}
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold text-aura-950 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-aura-950">{formatCurrency(product.price)}</p>
            {!outOfStock && (
              <p className="mt-1 text-sm text-aura-500">{product.stock} in stock</p>
            )}
            {outOfStock && (
              <p className="mt-1 text-sm font-medium text-red-600">Sold out</p>
            )}
            {product.description && (
              <p className="mt-6 leading-relaxed text-aura-700">{product.description}</p>
            )}
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="mt-8 rounded-full bg-aura-950 px-8 py-3 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:cursor-not-allowed disabled:bg-aura-300"
            >
              {outOfStock ? "Unavailable" : added ? "Added to cart ✓" : "Add to cart"}
            </button>
          </div>
        </div>

        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}
