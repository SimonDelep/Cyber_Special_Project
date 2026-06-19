export function Story() {
  return (
    <section
      id="story"
      className="scroll-mt-20 px-6 py-20"
      aria-labelledby="story-heading"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div id="coffee" className="scroll-mt-24">
          <p className="text-xs font-medium uppercase tracking-widest text-sage-dark">
            Our promise
          </p>
          <h2
            id="story-heading"
            className="mt-3 font-display text-3xl text-espresso md:text-4xl"
          >
            From farm to ritual
          </h2>
          <p className="mt-6 leading-relaxed text-espresso/75">
            RoastRitual partners directly with smallholder cooperatives in
            Ethiopia, Colombia, and beyond. We pay above fair-trade minimums and
            publish impact reports every season.
          </p>
          <p
            id="tea"
            className="mt-4 scroll-mt-24 leading-relaxed text-espresso/75"
          >
            Our herbal teas are certified organic, hand-picked, and packed
            without plastic liners. Every subscription supports reforestation
            projects in origin communities.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "40+", label: "Partner farms" },
            { value: "100%", label: "Recyclable packaging" },
            { value: "48h", label: "Roast-to-ship" },
            { value: "0", label: "Artificial flavors" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-sage/20 bg-sage/10 p-6 text-center"
            >
              <p className="font-display text-3xl text-espresso">{stat.value}</p>
              <p className="mt-1 text-sm text-espresso/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
