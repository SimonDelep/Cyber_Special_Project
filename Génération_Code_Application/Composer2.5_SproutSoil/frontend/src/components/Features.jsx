const features = [
  {
    icon: "💡",
    title: "Smart Grow Technology",
    description:
      "App-connected LED lights and watering schedules adapt to each herb's needs automatically.",
  },
  {
    icon: "🏺",
    title: "Self-Watering Design",
    description:
      "Ceramic planters with built-in reservoirs keep soil perfectly moist — even when you're away.",
  },
  {
    icon: "🧪",
    title: "Specialized Nutrients",
    description:
      "Our fine-mist formulas deliver the exact micronutrients indoor herbs crave, without overfeeding.",
  },
  {
    icon: "♻️",
    title: "Sustainable Materials",
    description:
      "Recyclable packaging, lead-free ceramics, and refillable mist bottles — good for you and the planet.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-soil-100/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-soil-950">
            Why SproutSoil?
          </h2>
          <p className="mt-4 text-soil-600">
            We combine thoughtful design with plant science so anyone can grow
            restaurant-quality herbs at home.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-soil-200/60"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="mt-4 font-display text-lg font-bold text-soil-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-soil-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
