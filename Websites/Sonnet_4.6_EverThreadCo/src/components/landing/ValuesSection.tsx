const values = [
  {
    title: "Certified organic cotton",
    description:
      "Grown in Egypt without synthetic pesticides — breathable, durable, and traceable from farm to fabric.",
  },
  {
    title: "Recycled fiber blend",
    description:
      "Post-consumer materials spun into new yarns, reducing landfill waste without sacrificing comfort.",
  },
  {
    title: "Timeless by design",
    description:
      "Neutral palettes and clean silhouettes built to layer season after season, not chase fast fashion.",
  },
];

export function ValuesSection() {
  return (
    <section id="fibers" className="bg-cream-100 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
            Our fibers
          </p>
          <h2 className="mt-3 font-display text-3xl text-sand-900 md:text-4xl">
            Made to feel good — and do good.
          </h2>
        </div>

        <ul className="mt-14 grid gap-8 md:grid-cols-3">
          {values.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-sand-200/80 bg-cream-50 p-8 shadow-sm"
            >
              <h3 className="font-display text-xl text-sand-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-sand-600">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
