export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-900/50 to-slate-900/80 px-8 py-14 text-center sm:px-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Built for the long haul
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-300">
            Every HydroFlasked piece is backed by our quality promise — premium materials,
            rigorous testing, and designs that age with you.
          </p>
          <a
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Start shopping
          </a>
        </div>
      </div>
    </section>
  );
}
