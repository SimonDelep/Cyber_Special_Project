"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { PublicReview } from "@/lib/reviews/serializers";
import { parseApiResponse } from "@/lib/parse-api-response";
import { FormField } from "@/components/ui/FormField";

type ReviewFormProps = {
  productId: string;
  existingReview?: PublicReview | null;
};

function isLocalUpload(url: string) {
  return url.startsWith("/uploads/");
}

export function ReviewForm({ productId, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [imageUrl, setImageUrl] = useState(existingReview?.imageUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/products/${productId}/reviews/image`, {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Upload failed");
        return;
      }

      setImageUrl(data.imageUrl as string);
      setMessage("Image uploaded — save your review to publish it.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Could not save review");
        return;
      }

      setMessage(existingReview ? "Review updated." : "Thank you! Your review was published.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <h3 className="text-lg font-semibold text-white">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      <label className="mt-4 block">
        <span className="text-sm text-slate-300">Rating</span>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full max-w-xs rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n !== 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>

      <FormField
        label="Title (optional)"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Summarize your experience"
      />

      <label className="mt-4 block">
        <span className="text-sm text-slate-300">Review</span>
        <textarea
          name="content"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share details about quality, insulation, design…"
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <FormField
        label="Photo URL (optional)"
        name="imageUrl"
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://example.com/photo.jpg"
      />

      <div className="mt-4">
        <span className="text-sm text-slate-300">Or upload a photo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
          className="mt-2 block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400"
        />
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, or GIF — max 2 MB</p>
      </div>

      {imageUrl ? (
        <div className="relative mt-4 h-40 w-full max-w-sm overflow-hidden rounded-xl border border-white/10">
          <Image
            src={imageUrl}
            alt="Review preview"
            fill
            className="object-cover"
            unoptimized={isLocalUpload(imageUrl)}
          />
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-brand-400">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
      >
        {loading ? "Saving…" : existingReview ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}

export function ReviewSignInPrompt() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center">
      <p className="text-slate-300">Sign in to leave a review for this product.</p>
      <div className="mt-4 flex justify-center gap-4">
        <Link
          href="/login"
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 hover:border-white/40"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
