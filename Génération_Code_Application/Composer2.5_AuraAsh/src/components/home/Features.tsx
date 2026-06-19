import type { FeatureItem } from "@/types";

const features: FeatureItem[] = [
  {
    title: "100% Soy Wax",
    description:
      "Clean-burning, renewable soy wax free from paraffin and harmful additives.",
  },
  {
    title: "Wooden Wicks",
    description:
      "Crackling wooden wicks create a cozy ambiance reminiscent of a gentle fireplace.",
  },
  {
    title: "Hand-Poured",
    description:
      "Each candle and holder is poured and finished by hand in small batches.",
  },
  {
    title: "Eco-Conscious",
    description:
      "Recyclable packaging and sustainably sourced materials throughout.",
  },
];

export function Features() {
  return (
    <section className="bg-charcoal py-24 text-cream">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-light">
            Why AuraAsh
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium">
            Crafted with intention, designed for your ritual
          </h2>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title}>
              <div className="mb-4 size-10 rounded-full border border-sage-light/30" />
              <h3 className="font-display text-xl">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone/80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
