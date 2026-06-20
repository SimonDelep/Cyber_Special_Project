import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-sage-light/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-ember/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
            Handcrafted home fragrance
          </p>
          <h1 className="mt-4 text-balance font-display text-5xl font-medium leading-tight text-charcoal md:text-6xl">
            Light, scent &amp; stillness for your space
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-stone">
            Discover hand-poured soy wax candles with crackling wooden wicks,
            sculptural concrete incense holders, and pure essential oil
            diffusers — each piece made to bring warmth and calm into everyday
            rituals.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="rounded-full bg-ember px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-ember-dark"
            >
              Explore Collection
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-stone/30 px-8 py-3 text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
            >
              Our Story
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-stone/20 via-sage-light/30 to-ember/20" />
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-warm-white/60 p-8 backdrop-blur-sm">
            <div className="size-24 rounded-full bg-gradient-to-b from-ember/30 to-sage/20" />
            <p className="mt-6 text-center font-display text-2xl text-charcoal">
              Soy Wax
            </p>
            <p className="mt-1 text-center text-sm text-stone">Wooden Wick Candles</p>
            <div className="mt-8 flex gap-3">
              <span className="size-3 rounded-full bg-ember/60" />
              <span className="size-3 rounded-full bg-sage/60" />
              <span className="size-3 rounded-full bg-stone/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
