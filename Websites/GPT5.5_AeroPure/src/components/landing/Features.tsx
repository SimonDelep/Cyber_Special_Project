const FEATURES = [
  {
    title: "Qi2 & MagSafe ready",
    description: "Fast, aligned wireless charging across your Apple ecosystem.",
  },
  {
    title: "Solar + USB-C PD",
    description: "Recharge anywhere with efficient solar panels and 65W output.",
  },
  {
    title: "Travel-first design",
    description: "Compact, durable gear that fits carry-on life without compromise.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-y border-border bg-surface px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Built for how you move
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="text-center md:text-left">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-accent md:mx-0" />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
