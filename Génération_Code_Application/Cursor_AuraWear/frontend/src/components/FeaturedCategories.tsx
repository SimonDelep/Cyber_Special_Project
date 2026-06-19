const categories = [
  {
    id: "women",
    title: "Women",
    description: "Dresses, tops, and layers for every season.",
    imageClass: "from-rose-200/80 to-aura-200",
  },
  {
    id: "men",
    title: "Men",
    description: "Tailored basics and relaxed weekend wear.",
    imageClass: "from-slate-300/80 to-aura-300",
  },
  {
    id: "accessories",
    title: "Accessories",
    description: "Bags, scarves, and finishing touches.",
    imageClass: "from-amber-200/80 to-aura-200",
  },
];

export default function FeaturedCategories() {
  return (
    <section id="collections" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="font-display text-3xl font-semibold text-aura-950 sm:text-4xl">
            Shop by category
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-aura-600">
            Curated collections to build your wardrobe with pieces that last.
          </p>
        </div>

        <div id="shop" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="group overflow-hidden rounded-2xl border border-aura-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className={`aspect-[4/5] bg-gradient-to-br ${category.imageClass} transition group-hover:scale-[1.02]`}
                role="img"
                aria-label={`${category.title} collection preview`}
              />
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-aura-950">{category.title}</h3>
                <p className="mt-2 text-sm text-aura-600">{category.description}</p>
                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-aura-800 underline-offset-4 transition hover:text-aura-950 hover:underline"
                >
                  Explore →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
