import { PRODUCT_CATEGORIES } from "@/lib/constants";

export function CategoryGrid() {
  return (
    <section id="categories" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Our product lines
          </h2>
          <p className="mt-3 text-muted">
            Three essentials for the connected traveler.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PRODUCT_CATEGORIES.map((category) => (
            <article
              key={category.id}
              className="group rounded-2xl border border-border bg-surface p-8 transition-shadow hover:shadow-lg"
            >
              <span className="text-4xl" role="img" aria-hidden>
                {category.icon}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {category.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
