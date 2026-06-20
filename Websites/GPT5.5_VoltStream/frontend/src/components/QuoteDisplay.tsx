import { useCallback, useEffect, useState } from "react";
import { fetchQuote, type Quote } from "../api/quote";

export default function QuoteDisplay() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuote = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchQuote()
      .then(setQuote)
      .catch(() => setError("Could not load quote."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  return (
    <section className="border-y border-grid-border/60 bg-grid-surface/30 px-6 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-grid-purple">Daily inspiration</p>

        {loading && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading quote">
            <div className="mx-auto h-5 max-w-lg animate-pulse rounded bg-grid-border/60" />
            <div className="mx-auto h-5 max-w-md animate-pulse rounded bg-grid-border/40" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-grid-border/30" />
          </div>
        )}

        {!loading && error && (
          <p className="mt-6 text-amber-400">{error}</p>
        )}

        {!loading && quote && (
          <blockquote className="mt-6">
            <p className="font-display text-xl leading-relaxed text-white md:text-2xl">
              &ldquo;{quote.quote}&rdquo;
            </p>
            <footer className="mt-4 text-sm text-grid-muted">
              — <cite className="font-medium text-grid-cyan not-italic">{quote.author}</cite>
            </footer>
          </blockquote>
        )}

        <button
          type="button"
          onClick={loadQuote}
          disabled={loading}
          className="mt-8 rounded-lg border border-grid-border px-4 py-2 text-sm font-medium text-grid-muted transition-colors hover:border-grid-cyan/50 hover:text-white disabled:opacity-50"
        >
          {loading ? "Loading…" : "New quote"}
        </button>
      </div>
    </section>
  );
}
