import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, resolveMediaUrl } from "../api/client";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import type { Review } from "../types/review";

function formatCategory(category: string) {
  return category.replace(/-/g, " ");
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-mist/30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addProduct } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const myReview = user
    ? reviews.find((r) => r.user_id === user.id) ?? null
    : null;
  const editing = Boolean(myReview);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([api.getProductBySlug(slug), api.getProductReviews(slug)])
      .then(([p, revs]) => {
        setProduct(p);
        setReviews(revs);
        setError("");
      })
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setTitle(myReview.title);
      setBody(myReview.body);
      setImageUrl(
        myReview.image_url?.startsWith("http") ? myReview.image_url : "",
      );
    }
  }, [myReview?.id]);

  async function reloadReviews() {
    if (!slug) return;
    const revs = await api.getProductReviews(slug);
    setReviews(revs);
    if (product) {
      const p = await api.getProductBySlug(slug);
      setProduct(p);
    }
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!slug) return;

    setReviewError("");
    setReviewMessage("");
    setReviewBusy(true);

    try {
      let review: Review;
      if (editing && myReview) {
        review = await api.updateProductReview(slug, myReview.id, {
          rating,
          title,
          body,
          image_url: imageUrl.trim() || null,
        });
      } else {
        review = await api.createProductReview(slug, {
          rating,
          title,
          body,
          image_url: imageUrl.trim() || undefined,
        });
      }

      if (imageFile) {
        review = await api.uploadReviewImage(slug, review.id, imageFile);
        setImageFile(null);
      } else if (imageUrl.trim() && !editing) {
        review = await api.setReviewImageUrl(slug, review.id, imageUrl.trim());
      } else if (imageUrl.trim() && editing && myReview) {
        review = await api.setReviewImageUrl(slug, myReview.id, imageUrl.trim());
      }

      await reloadReviews();
      setReviewMessage(editing ? "Review updated." : "Review published.");
      if (!editing) {
        setTitle("");
        setBody("");
        setImageUrl("");
        setRating(5);
      }
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Could not save review");
    } finally {
      setReviewBusy(false);
    }
  }

  async function handleDeleteReview() {
    if (!slug || !myReview || !confirm("Delete your review?")) return;
    setReviewBusy(true);
    try {
      await api.deleteProductReview(slug, myReview.id);
      setTitle("");
      setBody("");
      setImageUrl("");
      setRating(5);
      setReviewMessage("Review deleted.");
      await reloadReviews();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink text-mist">
        <Navbar />
        <p className="pt-28 text-center text-mist/50">Loading…</p>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen bg-ink text-mist">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 pt-28 text-center">
          <p>{error || "Product not found."}</p>
          <Link to="/catalog" className="mt-6 inline-block text-gold hover:underline">
            Back to catalog
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
        <Link to="/catalog" className="text-sm text-mist/50 transition hover:text-gold">
          ← Catalog
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-sm border border-white/5 bg-deep">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-mist/30">
                No image
              </div>
            )}
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-fog">
              {formatCategory(product.category)}
            </span>
            <h1 className="mt-2 font-display text-4xl text-mist">{product.name}</h1>
            {product.average_rating != null && (
              <p className="mt-2 text-sm text-mist/60">
                <Stars rating={Math.round(product.average_rating)} />{" "}
                {product.average_rating.toFixed(1)} · {product.review_count ?? 0}{" "}
                review{(product.review_count ?? 0) === 1 ? "" : "s"}
              </p>
            )}
            <p className="mt-4 leading-relaxed text-mist/70">{product.description}</p>
            <p className="mt-6 text-2xl font-medium text-gold">
              ${Number(product.price).toFixed(2)}
            </p>
            <button
              type="button"
              onClick={() => {
                if (!user) navigate("/login");
                else addProduct(product);
              }}
              className="mt-6 rounded-sm bg-gold px-8 py-3 text-sm font-medium text-ink transition hover:bg-gold/90"
            >
              Add to cart
            </button>
          </div>
        </div>

        <section className="mt-16 border-t border-white/5 pt-12">
          <h2 className="font-display text-2xl text-mist">Customer reviews</h2>

          {reviews.length === 0 ? (
            <p className="mt-4 text-mist/50">No reviews yet. Be the first!</p>
          ) : (
            <ul className="mt-8 space-y-8">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-sm border border-white/5 bg-deep/30 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gold">{review.username}</span>
                    <Stars rating={review.rating} />
                  </div>
                  <h3 className="mt-2 font-display text-lg">{review.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist/70">
                    {review.body}
                  </p>
                  {review.image_url && (
                    <img
                      src={resolveMediaUrl(review.image_url) ?? ""}
                      alt=""
                      className="mt-4 max-h-64 rounded-sm object-cover"
                    />
                  )}
                  <p className="mt-3 text-xs text-mist/40">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12 rounded-sm border border-white/5 bg-deep/50 p-6">
          <h2 className="font-display text-xl text-gold">
            {editing ? "Edit your review" : "Write a review"}
          </h2>

          {!user ? (
            <p className="mt-4 text-sm text-mist/60">
              <Link to="/login" className="text-gold hover:underline">
                Log in
              </Link>{" "}
              to leave a review.
            </p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
              {reviewMessage && (
                <p className="text-sm text-gold">{reviewMessage}</p>
              )}
              {reviewError && (
                <p className="text-sm text-red-300">{reviewError}</p>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider text-fog">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1 rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-fog">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-fog">
                  Review
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-fog">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-fog">
                  Or upload a photo
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-mist/70"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={reviewBusy}
                  className="rounded-sm bg-gold px-6 py-2 text-sm font-medium text-ink disabled:opacity-50"
                >
                  {reviewBusy
                    ? "Saving…"
                    : editing
                      ? "Update review"
                      : "Submit review"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={reviewBusy}
                    className="rounded-sm border border-red-400/40 px-4 py-2 text-sm text-red-300"
                  >
                    Delete review
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
