import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-sage-200/40">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-sage-100)_0%,_transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <p className="text-sm font-medium uppercase tracking-widest text-sage-500">
          Plant-based · Cruelty-free
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-tight text-sage-900 sm:text-6xl lg:text-7xl">
          Skincare that blooms from nature
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-sage-700">
          Shop six plant-based essentials—facial serums, exosome-infused night creams, and
          botanical under-eye patches formulated without compromise.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/products"
            className="rounded-full bg-sage-700 px-8 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-sage-900"
          >
            Browse catalog
          </Link>
          <Link
            href="#products"
            className="rounded-full border border-sage-300 px-8 py-3 text-sm font-medium text-sage-800 transition-colors hover:border-sage-500 hover:bg-sage-50"
          >
            Featured picks
          </Link>
          <Link
            href="#values"
            className="rounded-full border border-sage-300 px-8 py-3 text-sm font-medium text-sage-800 transition-colors hover:border-sage-500 hover:bg-sage-50 sm:ml-0"
          >
            Our ingredients
          </Link>
        </div>
      </div>
    </section>
  );
}
