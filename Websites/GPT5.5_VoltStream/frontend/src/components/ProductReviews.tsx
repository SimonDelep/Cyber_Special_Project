import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteMyProductReview,
  fetchProductReviews,
  reviewImageSrc,
  type Review,
} from "../api/reviews";
import { useAuth } from "../contexts/AuthContext";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

interface Props {
  productId: number;
}

export default function ProductReviews({ productId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadReviews = useCallback(() => {
    setLoading(true);
    fetchProductReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;
    try {
      await deleteMyProductReview(productId);
      setEditing(false);
      setShowForm(false);
      loadReviews();
    } catch {
      /* ignore */
    }
  };

  const handleSuccess = () => {
    setEditing(false);
    setShowForm(false);
    loadReviews();
  };

  return (
    <section className="mt-16 border-t border-grid-border pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Customer reviews</h2>
          {average !== null && (
            <div className="mt-2 flex items-center gap-3">
              <StarRating value={Math.round(average)} size="sm" />
              <span className="text-sm text-grid-muted">
                {average.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {user && !myReview && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl border border-grid-cyan/40 px-5 py-2 text-sm font-semibold text-grid-cyan hover:bg-grid-cyan/10"
          >
            Write a review
          </button>
        )}
      </div>

      {!user && (
        <p className="mt-6 text-sm text-grid-muted">
          <Link to="/login" state={{ from: `/products/${productId}` }} className="text-grid-cyan hover:underline">
            Sign in
          </Link>{" "}
          to leave a review with an optional photo (link or upload).
        </p>
      )}

      {user && myReview && !editing && !showForm && (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-grid-cyan hover:underline"
          >
            Edit your review
          </button>
          <button type="button" onClick={handleDelete} className="text-sm text-amber-400 hover:underline">
            Delete
          </button>
        </div>
      )}

      {user && (showForm || editing) && (
        <div className="mt-6">
          <ReviewForm
            productId={productId}
            existing={editing ? myReview : null}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditing(false);
            }}
          />
        </div>
      )}

      {loading && <p className="mt-8 text-grid-muted">Loading reviews…</p>}

      {!loading && reviews.length === 0 && (
        <p className="mt-8 text-grid-muted">No reviews yet. Be the first to share your thoughts!</p>
      )}

      <ul className="mt-8 space-y-6">
        {reviews.map((review) => (
          <li
            key={review.id}
            className={`rounded-2xl border border-grid-border bg-grid-surface/60 p-6 ${
              myReview?.id === review.id ? "ring-1 ring-grid-cyan/30" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{review.user_name}</p>
                <StarRating value={review.rating} size="sm" />
              </div>
              <time className="text-xs text-grid-muted">
                {new Date(review.created_at).toLocaleDateString()}
              </time>
            </div>
            <h3 className="mt-3 font-medium text-white">{review.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-grid-muted">{review.body}</p>
            {review.image_url && (
              <img
                src={reviewImageSrc(review.image_url) ?? ""}
                alt=""
                className="mt-4 max-h-64 rounded-lg border border-grid-border object-contain"
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
