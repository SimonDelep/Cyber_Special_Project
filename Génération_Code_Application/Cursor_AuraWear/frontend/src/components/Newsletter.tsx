export default function Newsletter() {
  return (
    <section className="border-y border-aura-200 bg-aura-100/50 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-aura-950 sm:text-3xl">
          Stay in the loop
        </h2>
        <p className="mt-3 text-aura-600">
          Be the first to know about new drops, exclusive offers, and style inspiration.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-full border border-aura-300 bg-white px-5 py-3 text-sm text-aura-950 placeholder:text-aura-400 focus:border-aura-500 focus:outline-none focus:ring-2 focus:ring-aura-500/20 sm:max-w-xs"
          />
          <button
            type="submit"
            className="rounded-full bg-aura-950 px-8 py-3 text-sm font-semibold text-aura-50 transition hover:bg-aura-800"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
