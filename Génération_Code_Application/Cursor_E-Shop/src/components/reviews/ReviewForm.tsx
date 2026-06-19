"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReviewAction, deleteReviewAction } from "@/actions/reviews";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/lib/action-state";

interface ReviewFormProps {
  productId: string;
  isLoggedIn: boolean;
  existingReview?: {
    rating: number;
    comment: string | null;
    imageUrl: string | null;
  } | null;
}

const initialState: ActionState = {};

type ImageTab = "url" | "upload";

export function ReviewForm({
  productId,
  isLoggedIn,
  existingReview,
}: ReviewFormProps) {
  const boundSubmit = submitReviewAction.bind(null, productId);
  const boundDelete = deleteReviewAction.bind(null, productId);
  const [submitState, submitAction] = useActionState(boundSubmit, initialState);
  const [deleteState, deleteAction] = useActionState(boundDelete, initialState);
  const [imageTab, setImageTab] = useState<ImageTab>(
    existingReview?.imageUrl?.startsWith("http") ? "url" : "upload"
  );

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  const defaultRating = existingReview?.rating ?? 5;
  const defaultComment = existingReview?.comment ?? "";
  const defaultImageUrl =
    existingReview?.imageUrl?.startsWith("http") ? existingReview.imageUrl : "";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-semibold text-zinc-50">
        {existingReview ? "Update your review" : "Write a review"}
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        One review per product. Submitting again updates your existing review.
      </p>

      <form action={submitAction} className="mt-6 space-y-5">
        <input type="hidden" name="imageSource" value={imageTab} />

        {submitState.error ? <Alert>{submitState.error}</Alert> : null}
        {submitState.success ? (
          <Alert variant="success">Review saved. Thank you!</Alert>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="rating" className="block text-sm font-medium text-zinc-300">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            defaultValue={String(defaultRating)}
            className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100"
            required
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          {submitState.fieldErrors?.rating?.[0] ? (
            <p className="text-sm text-red-400">{submitState.fieldErrors.rating[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-300">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            defaultValue={defaultComment}
            placeholder="What did you like about this product?"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {submitState.fieldErrors?.comment?.[0] ? (
            <p className="text-sm text-red-400">{submitState.fieldErrors.comment[0]}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-300">Photo (optional)</p>
          {existingReview?.imageUrl ? (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={existingReview.imageUrl}
                alt="Current review"
                className="max-h-40 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => setImageTab("url")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                imageTab === "url"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setImageTab("upload")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                imageTab === "upload"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Upload file
            </button>
          </div>

          {imageTab === "url" ? (
            <Input
              label="Image URL"
              name="reviewImageUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              defaultValue={defaultImageUrl}
              error={submitState.fieldErrors?.reviewImageUrl?.[0]}
            />
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="reviewImageFile"
                className="block text-sm font-medium text-zinc-300"
              >
                Image file
              </label>
              <input
                id="reviewImageFile"
                name="reviewImageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:file:bg-cyan-400"
              />
              <p className="text-xs text-zinc-500">
                JPEG, PNG, WebP, or GIF — maximum 2 MB. Leave empty to keep your
                current photo when updating.
              </p>
              {submitState.fieldErrors?.reviewImageFile?.[0] ? (
                <p className="text-sm text-red-400">
                  {submitState.fieldErrors.reviewImageFile[0]}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <SubmitButton pendingLabel="Saving…">
          {existingReview ? "Update review" : "Submit review"}
        </SubmitButton>
      </form>

      {existingReview ? (
        <form action={deleteAction} className="mt-4 border-t border-zinc-800 pt-4">
          {deleteState.error ? <Alert>{deleteState.error}</Alert> : null}
          {deleteState.success ? (
            <Alert variant="success">Review removed.</Alert>
          ) : null}
          <button
            type="submit"
            className="text-sm text-red-400 transition hover:text-red-300"
          >
            Delete my review
          </button>
        </form>
      ) : null}
    </div>
  );
}
