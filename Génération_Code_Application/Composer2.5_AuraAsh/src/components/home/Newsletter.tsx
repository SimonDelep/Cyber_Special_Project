export function Newsletter() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-3xl bg-cream px-8 py-16 text-center md:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
          Stay in the loop
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium text-charcoal md:text-4xl">
          New scents &amp; seasonal drops
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-stone">
          Join our newsletter for early access to limited editions, restock
          alerts, and mindful living inspiration.
        </p>

        <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="flex-1 rounded-full border border-stone/25 bg-warm-white px-5 py-3 text-sm outline-none transition-colors focus:border-ember"
          />
          <button
            type="submit"
            className="rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-ash"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
