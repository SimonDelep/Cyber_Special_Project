import Link from "next/link";
import type { CategoryCard } from "@/types";

const categories: CategoryCard[] = [
  {
    title: "Soy Wax Candles",
    description:
      "Hand-poured with wooden wicks for a gentle crackle and clean, long-lasting burn.",
    href: "/shop/candles",
    accent: "from-ember/20 to-ember/5",
  },
  {
    title: "Concrete Incense Holders",
    description:
      "Minimal sculptural pieces that anchor your ritual and complement any interior.",
    href: "/shop/incense-holders",
    accent: "from-stone/25 to-stone/5",
  },
  {
    title: "Essential Oil Diffusers",
    description:
      "Ultrasonic diffusers paired with pure essential oil blends for natural aromatherapy.",
    href: "/shop/diffusers",
    accent: "from-sage/25 to-sage/5",
  },
];

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
          Collections
        </p>
        <h2 className="mt-3 font-display text-4xl font-medium text-charcoal">
          Curated for calm living
        </h2>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group flex flex-col rounded-2xl border border-stone/15 bg-warm-white p-8 transition-shadow hover:shadow-lg"
          >
            <div
              className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${category.accent} transition-transform group-hover:scale-[1.02]`}
            />
            <h3 className="mt-6 font-display text-2xl text-charcoal">
              {category.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">
              {category.description}
            </p>
            <span className="mt-6 text-sm font-medium text-ember transition-colors group-hover:text-ember-dark">
              Shop now &rarr;
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
