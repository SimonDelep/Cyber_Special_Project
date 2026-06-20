export default function Hero() {
  return (
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-brand-200),transparent)]" />

      <div class="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-28">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Built for the workweek
            </p>
            <h1 class="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Meal prep that looks as sharp as your schedule.
            </h1>
            <p class="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Stackable borosilicate glass containers and leak-proof bento boxes
              for professionals who refuse to compromise on nutrition, style,
              or desk space.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
              <a
                href="/catalog"
                class="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
              >
                Explore catalog
              </a>
              <a
                href="#features"
                class="inline-flex items-center justify-center rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                See how it stacks
              </a>
            </div>
            <dl class="mt-10 grid grid-cols-3 gap-4 border-t border-brand-100 pt-8">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">
                  Material
                </dt>
                <dd class="mt-1 font-semibold text-ink">Borosilicate glass</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">
                  Seal
                </dt>
                <dd class="mt-1 font-semibold text-ink">Leak-proof</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">
                  Design
                </dt>
                <dd class="mt-1 font-semibold text-ink">Stackable</dd>
              </div>
            </dl>
          </div>

          <div class="relative">
            <div class="aspect-[4/5] overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-white to-brand-50 shadow-2xl shadow-brand-900/10">
              <img
                src="/images/hero-showcase.svg"
                alt="Stack of glass meal prep containers"
                class="h-full w-full object-cover p-8"
                width={480}
                height={600}
              />
            </div>
            <div class="absolute -bottom-4 -left-4 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-lg sm:-left-6">
              <p class="text-xs font-medium text-muted">Sunday prep → Friday lunch</p>
              <p class="font-display text-lg font-semibold text-brand-700">
                One system. Zero leaks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
