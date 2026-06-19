import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatMoney, productApi, reviewApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import StarRating from "../components/StarRating";

const CATEGORY_LABELS = {
  "herb-garden-kits": "Herb Garden Kits",
  planters: "Planters",
  "nutrient-mists": "Nutrient Mists",
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const myReview = user
    ? reviews.find((r) => r.user_id === user.id)
    : null;

  const load = () => {
    setLoading(true);
    productApi
      .getBySlug(slug)
      .then((p) => {
        setProduct(p);
        return reviewApi.list(p.id);
      })
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  const handleReviewSuccess = () => {
    if (product) {
      reviewApi.list(product.id).then(setReviews);
      productApi.getBySlug(slug).then(setProduct);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-soil-500">
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-red-600">{error || "Product not found"}</p>
        <Link to="/catalog" className="mt-4 inline-block text-sprout-600 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/catalog" className="text-sm text-sprout-600 hover:underline">
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-soil-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full max-h-[28rem] w-full object-cover"
            />
          ) : (
            <span className="flex h-80 items-center justify-center text-6xl">🌿</span>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-sprout-600">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-soil-950">
            {product.name}
          </h1>

          {product.average_rating != null && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating value={Math.round(product.average_rating)} readonly size="lg" />
              <span className="text-sm text-soil-600">
                {product.average_rating} out of 5 · {product.review_count} review
                {product.review_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <p className="mt-4 text-3xl font-bold text-soil-900">
            {formatMoney(product.price)}
          </p>
          <p className="mt-4 text-soil-600 leading-relaxed">{product.description}</p>

          <button
            type="button"
            onClick={() => {
              addToCart(product);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            className={`mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-colors ${
              added ? "bg-sprout-500" : "bg-soil-800 hover:bg-sprout-600"
            }`}
          >
            {added ? "Added to cart!" : "Add to cart"}
          </button>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold text-soil-950">Customer reviews</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <ReviewForm
            productId={product.id}
            existingReview={myReview}
            onSuccess={handleReviewSuccess}
          />
          <ReviewList reviews={reviews} />
        </div>
      </section>
    </div>
  );
}
