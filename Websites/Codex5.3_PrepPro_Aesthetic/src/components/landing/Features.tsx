const features = [
  {
    title: "Vertical stacking",
    description:
      "Uniform footprint lets you stack containers in your commute bag and fridge without toppling.",
    icon: "▣",
  },
  {
    title: "Silicone-lock lids",
    description:
      "Leak-proof seals keep dressings and broths contained — tested for briefcase and backpack carry.",
    icon: "◎",
  },
  {
    title: "Microwave & dishwasher safe",
    description:
      "Glass bases handle heat; lids are top-rack safe. Reheat at the office in minutes.",
    icon: "◈",
  },
  {
    title: "Professional aesthetic",
    description:
      "Clear glass and muted lids look intentional on a conference table, not like leftover takeout.",
    icon: "◇",
  },
];

export default function Features() {
  return (
    <section id="features" class="border-y border-brand-100 bg-white py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="max-w-2xl">
          <h2 class="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Engineered for professionals
          </h2>
          <p class="mt-4 text-lg text-muted">
            Every detail supports a repeatable weekly prep ritual — from Sunday
            batch cooking to Friday desk lunch.
          </p>
        </div>

        <ul class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li class="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg text-white"
                aria-hidden="true"
              >
                {feature.icon}
              </span>
              <h3 class="mt-4 font-semibold text-ink">{feature.title}</h3>
              <p class="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
