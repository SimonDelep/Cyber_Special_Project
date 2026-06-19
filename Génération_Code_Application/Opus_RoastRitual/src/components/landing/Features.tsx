import type { Feature } from "@/types";

const features: Feature[] = [
  {
    icon: "bean",
    title: "Specialty whole bean",
    description:
      "Single-origin and small-lot coffees, roasted fresh and shipped within 48 hours of roasting.",
  },
  {
    icon: "leaf",
    title: "Loose-leaf herbal tea",
    description:
      "Organic botanical blends without artificial flavors — perfect for calm morning or evening rituals.",
  },
  {
    icon: "box",
    title: "Flexible subscriptions",
    description:
      "Monthly or quarterly boxes tailored to coffee lovers, tea drinkers, or both in one household.",
  },
  {
    icon: "heart",
    title: "Ethical sourcing",
    description:
      "Transparent supply chains, fair prices for farmers, and recyclable packaging throughout.",
  },
];

function FeatureIcon({ icon }: { icon: Feature["icon"] }) {
  const paths: Record<Feature["icon"], string> = {
    bean: "M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12z",
    leaf: "M12 22s8-4 8-12a8 8 0 0 0-16 0c0 8 8 12 8 12z",
    box: "M21 8v13H3V8M1 6l11-4 11 4M12 22V6",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z",
  };

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/20 text-sage-dark">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden
      >
        <path d={paths[icon]} />
      </svg>
    </div>
  );
}

export function Features() {
  return (
    <section className="px-6 py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        <h2
          id="features-heading"
          className="font-display text-center text-3xl text-espresso md:text-4xl"
        >
          Crafted for conscious drinkers
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-espresso/70">
          Every bag tells a story — from highland farms to your grinder or
          teapot.
        </p>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-sage/20 bg-cream/50 p-6 transition-shadow hover:shadow-md"
            >
              <FeatureIcon icon={feature.icon} />
              <h3 className="mt-4 font-medium text-espresso">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso/70">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
