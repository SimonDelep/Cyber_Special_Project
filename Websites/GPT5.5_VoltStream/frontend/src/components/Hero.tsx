export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(168, 85, 247, 0.15), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl text-center">
        <p className="mb-4 inline-block rounded-full border border-grid-cyan/30 bg-grid-cyan/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-grid-cyan">
          Premium gaming peripherals
        </p>
        <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
          Build your
          <span className="block bg-gradient-to-r from-grid-cyan via-white to-grid-purple bg-clip-text text-transparent">
            perfect battlestation
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-grid-muted">
          Browse keyboards, mice, and RGB desk mats — eight products built for comfort, speed, and
          style.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/catalog"
            className="rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple px-8 py-3.5 font-semibold text-grid-dark shadow-lg shadow-grid-cyan/20 transition-transform hover:scale-[1.02]"
          >
            Browse catalog
          </a>
          <a
            href="/#categories"
            className="rounded-xl border border-grid-border bg-grid-surface px-8 py-3.5 font-semibold text-white transition-colors hover:border-grid-cyan/50"
          >
            Browse Categories
          </a>
        </div>
      </div>
    </section>
  );
}
