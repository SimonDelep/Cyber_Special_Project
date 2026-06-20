import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-linen to-sage/10 px-6 py-20 md:py-28">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sage/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-espresso/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 inline-block rounded-full border border-sage/30 bg-cream/60 px-4 py-1 text-xs font-medium uppercase tracking-widest text-sage-dark">
            Ethically sourced · Small-batch
          </p>
          <h1 className="font-display text-4xl leading-tight text-espresso md:text-5xl lg:text-6xl">
            Your daily ritual,{" "}
            <span className="text-sage-dark">roasted with care</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/75">
            Specialty whole-bean coffees and loose-leaf herbal teas — curated
            subscription boxes that honor farmers, flavor, and the planet.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="#subscriptions">Start your subscription</Button>
            <Button href="/catalog" variant="secondary">
              Browse catalog
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-sage/25 bg-gradient-to-br from-espresso via-espresso-light to-sage-dark shadow-2xl shadow-espresso/25">
            <div className="flex h-full flex-col justify-end p-8 text-cream">
              <p className="text-xs uppercase tracking-widest text-cream/70">
                This month&apos;s box
              </p>
              <p className="mt-2 font-display text-2xl">Morning Ritual</p>
              <p className="mt-2 text-sm text-cream/80">
                Yirgacheffe · Colombian Huila · cupping notes inside
              </p>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-2xl border border-sage/30 bg-cream px-4 py-3 shadow-lg">
            <p className="text-xs font-medium text-sage-dark">Fair trade</p>
            <p className="text-sm text-espresso">Direct farm partnerships</p>
          </div>
        </div>
      </div>
    </section>
  );
}
