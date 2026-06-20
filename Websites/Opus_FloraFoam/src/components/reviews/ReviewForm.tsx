"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createReviewAction, type ReviewActionState } from "@/app/products/[slug]/actions";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { StarRatingInput } from "@/components/reviews/StarRating";

type ReviewFormProps = {
  productId: string;
  isLoggedIn: boolean;
  loginCallbackUrl: string;
};

const initialState: ReviewActionState = {};

export function ReviewForm({ productId, isLoggedIn, loginCallbackUrl }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(createReviewAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-sage-200/80 bg-sage-50/50 p-6 text-center">
        <p className="text-sage-700">Sign in to write a review.</p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
          className="mt-3 inline-block text-sm font-medium text-sage-800 underline hover:text-sage-900"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="rounded-2xl border border-sage-300 bg-sage-50 p-6">
        <FormMessage type="success" message="Thank you! Your review has been published." />
      </div>
    );
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/reviews/image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }

      setImageUrl(data.imageUrl);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
      <h3 className="font-display text-lg font-semibold text-sage-900">Write a review</h3>

      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {state.error && <FormMessage type="error" message={state.error} />}

      <StarRatingInput name="rating" error={state.fieldErrors?.rating?.[0]} />

      <FormField
        label="Title (optional)"
        name="title"
        maxLength={120}
        error={state.fieldErrors?.title?.[0]}
      />

      <FormField label="Your review" name="body" error={state.fieldErrors?.body?.[0]}>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          minLength={10}
          className="w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200"
          placeholder="Share how this product worked for you…"
        />
      </FormField>

      <div className="space-y-3">
        <p className="text-sm font-medium text-sage-800">Photo (optional)</p>
        <div className="space-y-1.5">
          <label htmlFor="imageUrlInput" className="block text-sm font-medium text-sage-800">
            Image URL
          </label>
          <input
            id="imageUrlInput"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200"
          />
          <p className="text-xs text-sage-500">Paste a link, or upload a file below</p>
          {state.fieldErrors?.imageUrl?.[0] && (
            <p className="text-xs text-red-600">{state.fieldErrors.imageUrl[0]}</p>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload image from device"}
          </button>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        </div>
        {imageUrl && (
          <div className="relative aspect-video max-w-xs overflow-hidden rounded-xl bg-sage-100">
            <Image src={imageUrl} alt="Review preview" fill className="object-cover" sizes="320px" />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
