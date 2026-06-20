"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type ReviewFormProps = {
  productId: string;
  productSlug: string;
  existingReviewId?: string | null;
};

export function ReviewForm({
  productId,
  productSlug,
  existingReviewId,
}: ReviewFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-cream-100 p-6 text-center">
        <p className="text-sm text-sand-700">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/catalog/${productSlug}`)}`}
            className="font-medium text-sage-700 hover:text-sage-900"
          >
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  if (existingReviewId) {
    return (
      <p className="rounded-2xl border border-sage-200 bg-sage-50 p-6 text-sm text-sage-800">
        You have already reviewed this product. Thank you for your feedback.
      </p>
    );
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/api/products/${productId}/reviews/image`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }

    setImageUrl(data.imageUrl);
    setMessage("Image uploaded");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        title: title || null,
        body,
        imageUrl: imageUrl || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit review");
      return;
    }

    setMessage("Thank you! Your review has been published.");
    router.refresh();
  }

  const previewImage = imageUrl.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-sand-200 bg-cream-50 p-6"
    >
      <h3 className="font-display text-xl text-sand-900">Write a review</h3>
      <p className="mt-1 text-sm text-sand-600">
        Signed in as @{session.user.username}
      </p>

      {message ? (
        <p className="mt-4 rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-sand-800">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`text-2xl transition-colors ${
                value <= rating ? "text-amber-600" : "text-sand-300"
              }`}
              aria-label={`${value} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Title (optional)"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <Textarea
          label="Your review"
          name="body"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share fit, fabric quality, and how it wears over time…"
        />

        <Input
          label="Photo URL (optional)"
          name="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-sand-800">
            Or upload a photo (max 2 MB)
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="text-sm text-sand-700 file:mr-4 file:rounded-full file:border-0 file:bg-sand-200 file:px-4 file:py-2 file:text-sm file:font-medium"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />
          {uploading ? (
            <p className="mt-2 text-xs text-sand-500">Uploading…</p>
          ) : null}
        </div>

        {previewImage ? (
          <div className="relative aspect-video max-w-xs overflow-hidden rounded-xl">
            <Image
              src={previewImage}
              alt="Review preview"
              fill
              className="object-cover"
              unoptimized={previewImage.startsWith("/uploads/")}
            />
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={loading} className="mt-6">
        {loading ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
