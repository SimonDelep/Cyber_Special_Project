import { FormEvent, useEffect, useState } from "react";
import type { Review } from "../api/reviews";
import { createProductReview, updateMyProductReview } from "../api/reviews";
import StarRating from "./StarRating";

type ImageMode = "none" | "url" | "file";

interface Props {
  productId: number;
  existing?: Review | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ productId, existing, onSuccess, onCancel }: Props) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [imageMode, setImageMode] = useState<ImageMode>(existing?.image_url ? "url" : "none");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageMode !== "file" || !imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, imageMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input = {
        rating,
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageMode === "url" ? imageUrl : undefined,
        imageFile: imageMode === "file" ? imageFile : undefined,
        clearImage: existing && imageMode === "none",
      };
      if (existing) {
        await updateMyProductReview(productId, input);
      } else {
        await createProductReview(productId, input);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-grid-border bg-grid-surface p-6">
      <h3 className="font-display text-lg font-bold text-white">
        {existing ? "Edit your review" : "Write a review"}
      </h3>

      <div className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-grid-muted">Rating</span>
        <div className="mt-1">
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-grid-muted">Title</span>
        <input
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white focus:border-grid-cyan focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-grid-muted">Review</span>
        <textarea
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white focus:border-grid-cyan focus:outline-none"
          placeholder="Share your experience with this product (min. 10 characters)…"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-grid-muted">
          Photo (optional)
        </legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(["none", "url", "file"] as ImageMode[]).map((mode) => (
            <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm text-grid-muted">
              <input
                type="radio"
                name="imageMode"
                checked={imageMode === mode}
                onChange={() => {
                  setImageMode(mode);
                  if (mode !== "file") setImageFile(null);
                  if (mode !== "url") setImageUrl("");
                }}
                className="accent-grid-cyan"
              />
              {mode === "none" ? "No photo" : mode === "url" ? "Image link" : "Upload from device"}
            </label>
          ))}
        </div>

        {imageMode === "url" && (
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="mt-3 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2.5 text-sm text-white placeholder:text-grid-muted focus:border-grid-cyan focus:outline-none"
          />
        )}

        {imageMode === "file" && (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="mt-3 w-full text-sm text-grid-muted file:mr-4 file:rounded-lg file:border-0 file:bg-grid-cyan/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-grid-cyan"
          />
        )}

        {(preview || (imageMode === "url" && imageUrl)) && (
          <img
            src={preview ?? imageUrl}
            alt="Review preview"
            className="mt-3 max-h-40 rounded-lg border border-grid-border object-contain"
          />
        )}
      </fieldset>

      {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-6 py-2.5 text-sm font-semibold text-grid-dark disabled:opacity-50"
        >
          {submitting ? "Saving…" : existing ? "Update review" : "Submit review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-grid-border px-6 py-2.5 text-sm font-semibold text-white hover:border-grid-cyan/50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
