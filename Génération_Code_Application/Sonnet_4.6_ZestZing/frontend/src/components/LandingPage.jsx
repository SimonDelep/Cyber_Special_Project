import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import QuotesSection from "./QuotesSection";

const highlights = [
  {
    emoji: "🌶️",
    title: "Gourmet Hot Sauces",
    description: "Layered heat from small-batch pepper blends.",
    accent: "from-orange-500 to-red-600",
  },
  {
    emoji: "✨",
    title: "Infused Truffle Oils",
    description: "Cold-pressed oils finished with real truffle.",
    accent: "from-amber-600 to-yellow-700",
  },
  {
    emoji: "🧂",
    title: "Artisanal Spice Blends",
    description: "Hand-ground mixes for rubs and finishing.",
    accent: "from-stone-600 to-stone-800",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-stone-50 to-amber-50">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,#fed7aa_0%,transparent_50%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Small batches · Big flavor
            </p>
            <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Heat, drizzle, and dust — curated for curious palates.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-stone-600 leading-relaxed">
              ZestZing brings together small-batch gourmet hot sauces, infused truffle
              oils, and artisanal spice blends — made in limited runs, never mass-produced.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="inline-flex items-center rounded-full bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
              >
                Browse Catalog
              </Link>
              <a
                href="#story"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-8 py-3.5 text-base font-semibold text-stone-800 hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
              Three Collections, One Obsession
            </h2>
            <p className="mt-4 text-stone-600 max-w-2xl mx-auto">
              Explore the full catalog with search, filters, and customer reviews.
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center rounded-full bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              View all products →
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center"
              >
                <div
                  className={`mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-2xl shadow-inner`}
                >
                  {item.emoji}
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-stone-600 leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <QuotesSection />

        <section
          id="story"
          className="border-t border-stone-200 bg-stone-900 text-stone-100"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Flavor with intention
              </h2>
              <p className="mt-6 text-stone-300 leading-relaxed text-lg">
                We partner with small producers who care about sourcing, process, and
                the kind of flavor that makes you pause mid-bite. ZestZing is your
                pantry upgrade — no compromise, no conveyor belt.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-stone-50 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <span className="font-display text-lg font-bold text-brand-700">ZestZing</span>
          <p>© {new Date().getFullYear()} ZestZing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
