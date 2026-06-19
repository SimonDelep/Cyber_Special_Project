import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sage-100/60 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
            Sustainable essentials
          </p>
          <h1 className="font-display text-4xl leading-tight text-sand-900 md:text-5xl lg:text-6xl">
            Wardrobe basics that outlast trends.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand-600">
            EverThread Co crafts timeless pieces from 100% certified organic
            Egyptian cotton and recycled fibers — soft on skin, gentle on the
            planet.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/catalog">Shop catalog</Button>
            <Button href="#fibers" variant="secondary">
              Our materials
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-sand-200 via-cream-100 to-sage-100 shadow-lg ring-1 ring-sand-200/80">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="font-display text-3xl text-sand-800/90">
              Organic · Recycled
            </span>
            <span className="max-w-xs text-sm text-sand-600">
              Placeholder for hero photography — product imagery coming soon.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
