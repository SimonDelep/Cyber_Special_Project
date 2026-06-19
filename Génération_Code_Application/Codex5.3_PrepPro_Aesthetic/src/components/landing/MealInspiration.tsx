import { createSignal, Show } from "solid-js";
import type { MealPreview } from "@/lib/open-api/themealdb";

type Props = {
  initialMeal: MealPreview | null;
};

export default function MealInspiration(props: Props) {
  const [meal, setMeal] = createSignal<MealPreview | null>(props.initialMeal);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  async function loadAnother() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inspiration/random-meal");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load a new recipe.");
        return;
      }
      setMeal(json.meal ?? null);
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="meal-inspiration"
      class="border-y border-brand-100 bg-brand-50/40 py-20"
      aria-labelledby="meal-inspiration-heading"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <p class="text-sm font-medium uppercase tracking-wide text-brand-600">
              Open API · live data
            </p>
            <h2
              id="meal-inspiration-heading"
              class="font-display text-3xl font-semibold text-ink sm:text-4xl"
            >
              Meal prep inspiration
            </h2>
            <p class="mt-3 text-lg text-muted">
              A random recipe idea from{" "}
              <a
                href="https://www.themealdb.com/"
                class="font-medium text-brand-700 underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                TheMealDB
              </a>{" "}
              — batch it Sunday, pack it in PrepPro all week.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-full border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={loadAnother}
            disabled={loading()}
          >
            {loading() ? "Loading…" : "Another idea"}
          </button>
        </div>

        <Show when={error()}>
          <p class="mt-6 rounded-xl border border-accent/30 bg-white px-4 py-3 text-sm text-accent">
            {error()}
          </p>
        </Show>

        <Show
          when={meal()}
          fallback={
            <p class="mt-10 rounded-2xl border border-brand-100 bg-white p-8 text-center text-muted">
              Recipe inspiration is temporarily unavailable. Use the button above
              to try again.
            </p>
          }
        >
          {(m) => (
            <article class="mt-10 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
              <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_1.1fr]">
                <div class="relative aspect-[4/3] bg-brand-100 lg:aspect-auto lg:min-h-[320px]">
                  <img
                    src={m().thumb}
                    alt={`Photo of ${m().name}`}
                    class="h-full w-full object-cover"
                    loading="lazy"
                    width={640}
                    height={480}
                  />
                </div>
                <div class="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div class="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-brand-600">
                    <span class="rounded-full bg-brand-100 px-3 py-1">
                      {m().category}
                    </span>
                    <span class="rounded-full bg-brand-100 px-3 py-1">
                      {m().area}
                    </span>
                  </div>
                  <h3 class="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
                    {m().name}
                  </h3>
                  <Show when={m().tags.length > 0}>
                    <p class="mt-3 text-sm text-muted">
                      Tags: {m().tags.join(" · ")}
                    </p>
                  </Show>
                  <p class="mt-4 text-sm leading-relaxed text-muted">
                    {m().instructionsPreview}
                  </p>
                  <div class="mt-6 flex flex-wrap gap-3">
                    <Show when={m().youtube}>
                      <a
                        href={m().youtube!}
                        class="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch tutorial
                      </a>
                    </Show>
                    <Show when={m().source}>
                      <a
                        href={m().source!}
                        class="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Full recipe
                      </a>
                    </Show>
                    <a
                      href="/catalog"
                      class="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                    >
                      Shop containers
                    </a>
                  </div>
                </div>
              </div>
            </article>
          )}
        </Show>
      </div>
    </section>
  );
}
