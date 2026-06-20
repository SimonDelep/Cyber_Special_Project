const categories = [
  {
    id: "keyboard",
    title: "Ergonomic Keyboards",
    description: "Split angles, gasket mounts, and switches tuned for long sessions.",
    icon: "⌨️",
    accent: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30",
  },
  {
    id: "mouse",
    title: "Precision Mice",
    description: "Ultra-light shells, flagship sensors, and shapes that fit your grip.",
    icon: "🖱️",
    accent: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
  },
  {
    id: "desk_mat",
    title: "RGB Desk Mats",
    description: "Spill-resistant surfaces with edge-to-edge customizable lighting.",
    icon: "🎨",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5",
    border: "border-fuchsia-500/30",
  },
];

export default function CategoryCards() {
  return (
    <section id="categories" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-3xl font-bold text-white md:text-4xl">
          Shop by category
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-grid-muted">
          Every product is picked for competitive play and all-day comfort.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {categories.map((cat) => (
            <article
              key={cat.id}
              className={`group rounded-2xl border bg-gradient-to-b ${cat.accent} ${cat.border} bg-grid-surface p-8 transition-transform hover:-translate-y-1`}
            >
              <span className="text-4xl" role="img" aria-hidden>
                {cat.icon}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-white">{cat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-grid-muted">{cat.description}</p>
              <a
                href={`/#products`}
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-grid-cyan transition-colors group-hover:text-white"
              >
                View products
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
