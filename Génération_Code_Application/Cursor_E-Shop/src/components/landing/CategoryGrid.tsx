import Link from "next/link";

const categories = [
  {
    name: "Phones",
    slug: "phones",
    emoji: "📱",
    description: "Smartphones, cases, and mobile essentials",
    gradient: "from-violet-600/50 via-fuchsia-600/20 to-transparent",
    accent: "group-hover:border-violet-500/40",
  },
  {
    name: "Laptops",
    slug: "laptops",
    emoji: "💻",
    description: "Ultrabooks, gaming rigs, and workstations",
    gradient: "from-cyan-600/50 via-blue-600/20 to-transparent",
    accent: "group-hover:border-cyan-500/40",
  },
  {
    name: "Audio",
    slug: "audio",
    emoji: "🎧",
    description: "Headphones, speakers, and studio equipment",
    gradient: "from-emerald-600/50 via-teal-600/20 to-transparent",
    accent: "group-hover:border-emerald-500/40",
  },
  {
    name: "Accessories",
    slug: "accessories",
    emoji: "⌨️",
    description: "Chargers, docks, keyboards, and more",
    gradient: "from-amber-600/50 via-orange-600/20 to-transparent",
    accent: "group-hover:border-amber-500/40",
  },
];

export function CategoryGrid() {
  return (
    <section id="categories" className="border-t border-zinc-800 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight">Shop by category</h2>
        <p className="mt-2 max-w-xl text-zinc-400">
          Find the right gear faster — every collection is curated and updated by our team.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}#featured`}
              className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 transition ${cat.accent}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 transition group-hover:opacity-100`}
                aria-hidden
              />
              <div className="relative">
                <span className="text-4xl" role="img" aria-hidden>
                  {cat.emoji}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-zinc-50">{cat.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {cat.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 opacity-0 transition group-hover:opacity-100">
                  Explore
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
