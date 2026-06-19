const values = [
  {
    title: "100% plant-based",
    description: "Botanical actives and vegan formulas—no animal-derived ingredients.",
  },
  {
    title: "Cruelty-free",
    description: "Never tested on animals. Certified compassionate from lab to shelf.",
  },
  {
    title: "Science-backed",
    description: "Exosome technology and clinical-grade botanicals for visible results.",
  },
];

export function Values() {
  return (
    <section id="values" className="bg-cream-100 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-semibold text-sage-900 sm:text-4xl">
          Beauty with a conscience
        </h2>
        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {values.map((value) => (
            <li
              key={value.title}
              className="rounded-2xl border border-sage-200/80 bg-cream-50 p-8 shadow-sm"
            >
              <h3 className="font-display text-xl font-semibold text-sage-800">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-sage-600">{value.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
