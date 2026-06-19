import { createSignal, Show } from "solid-js";

type Props = {
  productSlug: string;
  onSubmitted: () => void;
};

export default function ReviewForm(props: Props) {
  const [rating, setRating] = createSignal(5);
  const [comment, setComment] = createSignal("");
  const [imageUrl, setImageUrl] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [uploadMessage, setUploadMessage] = createSignal("");

  let fileInputEl: HTMLInputElement | undefined;

  async function handleImageUpload() {
    setUploadMessage("");
    setError("");

    const file = fileInputEl?.files?.[0];
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    const data = new FormData();
    data.set("image", file);

    try {
      const res = await fetch(`/api/products/${props.productSlug}/reviews/image`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      setImageUrl(json.imageUrl);
      setUploadMessage("Image uploaded. It will be attached when you submit.");
      if (fileInputEl) fileInputEl.value = "";
    } catch {
      setError("Upload failed.");
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${props.productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: rating(),
          comment: comment(),
          imageUrl: imageUrl(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not submit review.");
        return;
      }
      props.onSubmitted();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      class="space-y-4 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h3 class="text-lg font-semibold text-ink">Write a review</h3>

      <div>
        <label class="block text-sm font-medium text-ink">Rating</label>
        <div class="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              class={`text-2xl transition ${
                star <= rating() ? "text-accent" : "text-brand-200"
              }`}
              onClick={() => setRating(star)}
              aria-label={`${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-ink" for="review-comment">
          Your review
        </label>
        <textarea
          id="review-comment"
          required
          minLength={10}
          rows={4}
          value={comment()}
          onInput={(e) => setComment(e.currentTarget.value)}
          class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          placeholder="Share how this product fits your meal prep routine…"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-ink" for="review-image-url">
          Photo URL (optional)
        </label>
        <input
          id="review-image-url"
          type="url"
          value={imageUrl()}
          onInput={(e) => setImageUrl(e.currentTarget.value)}
          placeholder="https://example.com/photo.jpg"
          class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-ink" for="review-image-file">
          Or upload a photo
        </label>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="review-image-file"
            ref={(el) => {
              fileInputEl = el;
            }}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="text-sm text-muted file:mr-2 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <button
            type="button"
            onClick={handleImageUpload}
            class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Upload image
          </button>
        </div>
        <Show when={uploadMessage()}>
          <p class="mt-2 text-xs text-brand-700">{uploadMessage()}</p>
        </Show>
        <Show when={imageUrl()}>
          <img
            src={imageUrl()}
            alt="Review preview"
            class="mt-3 max-h-40 rounded-lg border border-brand-100 object-cover"
          />
        </Show>
      </div>

      <Show when={error()}>
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error()}</p>
      </Show>

      <button
        type="submit"
        disabled={loading()}
        class="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading() ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
