const categories = [
  {
    id: "oral-care",
    title: "Oral care",
    description: "Biodegradable bamboo toothbrushes with plant-based bristles.",
    emoji: "🪥",
  },
  {
    id: "personal-care",
    title: "Personal care",
    description: "Concentrated shampoo bars — no bottles, no waste.",
    emoji: "🧼",
  },
  {
    id: "household",
    title: "Household",
    description: "Refillable cleaners that work with the bottles you already own.",
    emoji: "✨",
  },
];

export default function CategoryCards() {
  return (
    <section id="mission" className="border-y border-forest-200/60 bg-forest-50/50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl font-semibold text-forest-800 md:text-3xl">
          Three ways to lighten your footprint
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          Every PureRoots product is designed to replace single-use plastic with materials
          that compost, dissolve, or refill.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="rounded-2xl border border-forest-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl" role="img" aria-label={cat.title}>
                {cat.emoji}
              </span>
              <h3 className="mt-4 font-semibold text-forest-700">{cat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{cat.description}</p>
              <a
                href="#products"
                className="mt-4 inline-block text-sm font-medium text-forest-600 hover:text-forest-700"
              >
                View products →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
