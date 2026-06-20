"use client";

export function NewsletterSection() {
  return (
    <section id="newsletter" className="py-20 md:py-24">
      <div className="mx-auto max-w-xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
          Stay in the loop
        </p>
        <h2 className="mt-3 font-display text-3xl text-sand-900">
          Join the waitlist
        </h2>
        <p className="mt-3 text-sm text-sand-600">
          Be first to know when new drops of organic cotton and recycled-fiber
          basics go live.
        </p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-full border border-sand-300 bg-cream-50 px-5 py-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
          <button
            type="submit"
            className="rounded-full bg-sand-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-sand-800"
          >
            Notify me
          </button>
        </form>
      </div>
    </section>
  );
}
