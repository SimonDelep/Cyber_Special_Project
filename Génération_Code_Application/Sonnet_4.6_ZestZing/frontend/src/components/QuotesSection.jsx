import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function QuotesSection() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api
      .getQuotes(3)
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  if (loading) {
    return (
      <section className="border-y border-stone-200 bg-amber-50/50 py-16">
        <p className="text-center text-stone-500 text-sm">Loading inspiration…</p>
      </section>
    );
  }

  if (quotes.length === 0) return null;

  const quote = quotes[active];

  return (
    <section
      id="quotes"
      className="border-y border-stone-200 bg-gradient-to-r from-brand-50 via-amber-50 to-brand-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Words on flavor
        </p>
        <blockquote className="mt-8">
          <p className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-snug">
            “{quote.content}”
          </p>
          <footer className="mt-6 text-stone-600">
            — <cite className="not-italic font-medium">{quote.author}</cite>
            {quote.source !== "zestzing" && (
              <span className="block mt-1 text-xs text-stone-400">
                via {quote.source === "dummyjson" ? "DummyJSON" : "Quotable"} API
              </span>
            )}
          </footer>
        </blockquote>

        {quotes.length > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {quotes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show quote ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-8 bg-brand-600" : "w-2 bg-stone-300 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-10 hidden sm:grid sm:grid-cols-3 gap-4 text-left">
          {quotes.map((q, i) => (
            <button
              key={`${q.author}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-xl border p-4 text-left transition-all ${
                i === active
                  ? "border-brand-300 bg-white shadow-md"
                  : "border-stone-200/80 bg-white/60 hover:bg-white"
              }`}
            >
              <p className="text-sm text-stone-700 line-clamp-3">“{q.content}”</p>
              <p className="mt-2 text-xs font-medium text-stone-500">{q.author}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
