import { Button } from "@/components/ui/Button";

const boxes = [
  {
    id: "morning-ritual",
    name: "Morning Ritual",
    tagline: "For coffee lovers",
    price: "$44.99",
    interval: "per month",
    description:
      "Two rotating ethically sourced whole-bean coffees with origin stories and brew guides.",
    accent: "from-espresso to-espresso-light",
  },
  {
    id: "evening-unwind",
    name: "Evening Unwind",
    tagline: "For tea rituals",
    price: "$34.99",
    interval: "per month",
    description:
      "Curated loose-leaf herbal blends — chamomile, peppermint, and seasonal botanicals.",
    accent: "from-sage-dark to-sage",
  },
  {
    id: "full-ritual",
    name: "Full Ritual",
    tagline: "Coffee & tea",
    price: "$69.99",
    interval: "per month",
    description:
      "The best of both worlds: one coffee and one herbal tea selection each month.",
    accent: "from-espresso-light to-sage-dark",
  },
];

export function SubscriptionPreview() {
  return (
    <section
      id="subscriptions"
      className="scroll-mt-20 bg-linen px-6 py-20"
      aria-labelledby="subscriptions-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="subscriptions-heading"
          className="font-display text-center text-3xl text-espresso md:text-4xl"
        >
          Subscription boxes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-espresso/70">
          Pause, skip, or cancel anytime. Free shipping on every box.
        </p>

        <ul className="mt-14 grid gap-8 md:grid-cols-3">
          {boxes.map((box) => (
            <li
              key={box.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-sage/25 bg-cream shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`h-36 bg-gradient-to-br ${box.accent} p-6 text-cream`}
              >
                <p className="text-xs uppercase tracking-widest text-cream/80">
                  {box.tagline}
                </p>
                <h3 className="mt-2 font-display text-2xl">{box.name}</h3>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-2xl font-semibold text-espresso">
                  {box.price}
                  <span className="text-sm font-normal text-espresso/60">
                    {" "}
                    {box.interval}
                  </span>
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-espresso/70">
                  {box.description}
                </p>
                <Button href="#" variant="secondary" className="mt-6 w-full">
                  Choose {box.name}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
