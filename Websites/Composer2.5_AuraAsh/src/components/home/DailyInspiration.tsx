"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { InspirationQuote } from "@/types";

interface DailyInspirationProps {
  initialQuote: InspirationQuote;
}

export function DailyInspiration({ initialQuote }: DailyInspirationProps) {
  const [quote, setQuote] = useState(initialQuote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshQuote() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inspiration");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not load a new quote");
        return;
      }

      setQuote(data.quote);
    } catch {
      setError("Could not load a new quote. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-y border-stone/15 bg-cream/60 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
          Daily ritual
        </p>
        <blockquote className="mt-6 font-display text-3xl font-medium leading-snug text-charcoal md:text-4xl">
          &ldquo;{quote.content}&rdquo;
        </blockquote>
        <p className="mt-6 text-sm text-stone">— {quote.author}</p>

        {error && (
          <p className="mt-4 text-sm text-ember" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            variant="secondary"
            onClick={refreshQuote}
            disabled={loading}
          >
            {loading ? "Loading..." : "New inspiration"}
          </Button>
          <p className="text-xs text-stone">
            Quotes powered by{" "}
            <a
              href="https://github.com/lukePeavey/quotable"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ember transition-colors hover:text-ember-dark"
            >
              Quotable API
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
