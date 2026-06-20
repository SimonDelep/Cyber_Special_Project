"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { SafeUser } from "@/lib/auth";

interface ReviewFormProps {
  productId: string;
  user: SafeUser;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/reviews/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      const url = data.imageUrl as string;
      setImageUrl(url);
      setPreview(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title,
          content,
          imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit review");
        return;
      }

      setSuccess("Thank you! Your review has been published.");
      setTitle("");
      setContent("");
      setImageUrl("");
      setPreview("");
      setRating(5);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone/15 bg-warm-white p-6">
      <h3 className="font-display text-xl text-charcoal">Write a review</h3>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-sage/10 px-4 py-3 text-sm text-charcoal">
          {success}
        </div>
      )}

      <div className="space-y-2">
        <span className="block text-sm font-medium text-charcoal">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} stars`}
              onClick={() => setRating(value)}
              className="rounded p-0.5 transition-colors hover:text-ember"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`size-6 ${value <= rating ? "text-ember" : "text-stone/30"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02l4.111-2.553 4.111 2.553c.714.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title (optional)"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Summarize your experience"
      />

      <Textarea
        label="Review"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share details about the scent, quality, or how you use it..."
        required
        rows={4}
      />

      <div className="space-y-3">
        <Input
          label="Photo URL (optional)"
          name="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreview(e.target.value);
          }}
          placeholder="https://example.com/photo.jpg"
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </Button>
          {preview && (
            <button
              type="button"
              className="text-sm text-stone hover:text-ember"
              onClick={() => {
                setImageUrl("");
                setPreview("");
              }}
            >
              Remove photo
            </button>
          )}
        </div>

        {preview && (
          <div className="overflow-hidden rounded-xl border border-stone/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Review preview" className="max-h-48 w-full object-cover" />
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting || uploading}>
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
