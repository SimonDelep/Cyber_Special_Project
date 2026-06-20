export function AboutSection() {
  return (
    <section id="about" className="border-y border-sand-200 bg-sand-900 py-20 text-cream-100 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:grid md:grid-cols-2 md:gap-16">
        <h2 className="font-display text-3xl text-cream-50 md:text-4xl">
          Slow fashion, woven with care.
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-sand-300 md:mt-0 md:text-base">
          <p>
            EverThread Co was founded on a simple belief: your everyday
            wardrobe should be as honest as the materials inside it. We partner
            with certified organic farms in Egypt and mills that integrate
            recycled fibers into every collection.
          </p>
          <p>
            Each garment is designed to be repaired, reworn, and passed on —
            because true sustainability starts with pieces you never want to
            replace.
          </p>
        </div>
      </div>
    </section>
  );
}
