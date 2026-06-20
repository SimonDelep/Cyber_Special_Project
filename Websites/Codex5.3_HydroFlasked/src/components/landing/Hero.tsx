export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-900)_0%,_transparent_55%)] opacity-60"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-400">
          Premium drinkware
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Stay hydrated.
          <br />
          <span className="text-slate-400">Stay elevated.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          Stainless steel travel tumblers, custom glassware, and insulated wine mugs —
          engineered for temperature control and designed to last.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/shop"
            className="inline-flex items-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Browse catalog
          </a>
          <a
            href="#featured"
            className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/50 hover:text-white"
          >
            View featured
          </a>
        </div>
      </div>
    </section>
  );
}
