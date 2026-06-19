"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type ReviewFormProps = {
  productSlug: string;
  isLoggedIn: boolean;
  hasExistingReview: boolean;
};

export function ReviewForm({
  productSlug,
  isLoggedIn,
  hasExistingReview,
}: ReviewFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-muted">Sign in to leave a review.</p>
        <a
          href={`/login?redirect=/products/${productSlug}`}
          className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (hasExistingReview) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
        You have already reviewed this product.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setError("Server error — try again");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit review");
        return;
      }

      setSuccess("Review submitted! Thank you.");
      form.reset();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-surface p-6"
    >
      <h3 className="text-lg font-semibold">Write a review</h3>
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div>
        <label htmlFor="rating" className="block text-sm font-medium">
          Rating <span className="text-accent">*</span>
        </label>
        <select
          id="rating"
          name="rating"
          required
          defaultValue="5"
          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
      </div>

      <FormField
        label="Title (optional)"
        name="title"
        placeholder="Summarize your experience"
      />
      <FormField
        label="Review"
        name="content"
        as="textarea"
        required
        rows={4}
        placeholder="Share your thoughts (min. 10 characters)"
      />
      <FormField
        label="Image URL (optional)"
        name="imageUrl"
        type="url"
        placeholder="https://example.com/photo.jpg"
      />
      <div>
        <label htmlFor="image" className="block text-sm font-medium">
          Or upload an image
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP, or GIF — max 2 MB</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-8 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
