import Link from "next/link";

const categories = [
  {
    title: "Travel Tumblers",
    description:
      "Double-wall vacuum insulated stainless steel. Cold 24h, hot 12h.",
    accent: "from-brand-600/30 to-brand-900/20",
    icon: "🥤",
    href: "/shop?category=TUMBLER",
  },
  {
    title: "Custom Glassware",
    description: "Etched and engraved borosilicate sets for home and gifting.",
    accent: "from-sky-600/20 to-slate-800/40",
    icon: "🥃",
    href: "/shop?category=GLASSWARE",
  },
  {
    title: "Wine Mugs",
    description: "Insulated mugs with splash-resistant lids for any occasion.",
    accent: "from-violet-600/20 to-slate-900/40",
    icon: "🍷",
    href: "/shop?category=WINE_MUG",
  },
];

export function Categories() {
  return (
    <section id="categories" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center sm:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Shop by category
          </h2>
          <p className="mt-3 text-slate-400">
            Three collections crafted for how you actually drink.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${cat.accent} p-8 transition hover:border-brand-500/40`}
            >
              <span className="text-4xl" role="img" aria-hidden>
                {cat.icon}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-white group-hover:text-brand-200">
                {cat.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {cat.description}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-400">
                Shop this category →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
