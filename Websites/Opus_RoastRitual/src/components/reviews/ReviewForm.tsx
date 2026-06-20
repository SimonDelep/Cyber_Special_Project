"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

type ReviewFormProps = {
  productSlug: string;
  hasExistingReview: boolean;
};

export function ReviewForm({ productSlug, hasExistingReview }: ReviewFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (status === "loading") {
    return <p className="text-sm text-espresso/60">Loading…</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-sm text-espresso/70">
        <a
          href={`/login?callbackUrl=/products/${productSlug}`}
          className="text-sage-dark underline"
        >
          Sign in
        </a>{" "}
        to write a review.
      </p>
    );
  }

  if (hasExistingReview) {
    return (
      <Alert variant="info">
        You have already submitted a review for this product.
      </Alert>
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/products/${productSlug}/reviews/image`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Upload failed" });
      return;
    }

    setImageUrl(data.imageUrl);
    setPreviewImage(data.imageUrl);
    setMessage({ type: "success", text: "Image uploaded" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await fetch(`/api/products/${productSlug}/reviews`, {
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
    setSubmitting(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to submit review" });
      return;
    }

    setMessage({ type: "success", text: "Thank you! Your review has been published." });
    router.refresh();
  }

  const displayPreview = previewImage || imageUrl || null;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Select
        label="Rating"
        name="rating"
        value={String(rating)}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value} star{value !== 1 ? "s" : ""}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Summarize your experience"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-body">Your review</Label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-xl border border-sage/30 bg-cream px-3 py-2 text-sm text-espresso focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
          placeholder="Share tasting notes, brew method, or what you loved…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-image-url">Photo URL (optional)</Label>
        <Input
          id="review-image-url"
          name="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewImage(e.target.value || null);
          }}
          placeholder="https://…"
        />
      </div>

      <div>
        <Label>Or upload a photo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-2 block w-full text-sm text-espresso/70 file:mr-4 file:rounded-full file:border-0 file:bg-sage/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-sage/30"
          onChange={(e) => void handleFileUpload(e)}
          disabled={uploading}
        />
        {uploading && (
          <p className="mt-1 text-xs text-espresso/60">Uploading…</p>
        )}
      </div>

      {displayPreview && (
        <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-sage/25">
          <Image
            src={displayPreview}
            alt="Review preview"
            fill
            className="object-cover"
            unoptimized={displayPreview.startsWith("/uploads/")}
          />
        </div>
      )}

      <Button type="submit" disabled={submitting || body.length < 10}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
