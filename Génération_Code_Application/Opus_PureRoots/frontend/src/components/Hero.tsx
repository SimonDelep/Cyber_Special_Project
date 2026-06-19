import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

interface HeroProps {
  products: Product[];
  loading?: boolean;
}

export default function Hero({ products, loading = false }: HeroProps) {
  const preview = products.slice(0, 3);
  const count = products.length;

  return (
    <section className="relative overflow-hidden px-6 pb-8 pt-12 md:pb-12 md:pt-16">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-forest-100/80 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/60 px-4 py-1.5 text-sm text-forest-600">
          <span className="h-2 w-2 rounded-full bg-sage-500" aria-hidden />
          Plastic-free essentials for everyday living
        </p>
        <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-forest-800 md:text-6xl">
          Clean habits.
          <span className="block text-forest-600">Zero compromise.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
          Shop {count > 0 ? `${count} curated` : "our"} sustainable products — biodegradable bamboo
          toothbrushes, zero-waste shampoo bars, and refillable household cleaners.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/catalog"
            className="rounded-full bg-forest-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest-600/20 transition hover:bg-forest-700"
          >
            Browse catalog
          </a>
          <a
            href="#mission"
            className="rounded-full border border-forest-200 bg-white px-8 py-3.5 text-sm font-semibold text-forest-700 transition hover:border-forest-300"
          >
            Why PureRoots
          </a>
        </div>
        <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-forest-200/80 pt-8 md:max-w-lg">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-stone-600">
              Plastic saved
            </dt>
            <dd className="font-display mt-1 text-2xl font-semibold text-forest-700">90%</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-stone-600">
              Products
            </dt>
            <dd className="font-display mt-1 text-2xl font-semibold text-forest-700">
              {loading ? "…" : count || "6+"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-stone-600">
              Shipping
            </dt>
            <dd className="font-display mt-1 text-2xl font-semibold text-forest-700">Carbon-neutral</dd>
          </div>
        </dl>

        {!loading && preview.length > 0 && (
          <div className="mt-14 border-t border-forest-200/60 pt-12">
            <h2 className="font-display text-xl font-semibold text-forest-800 md:text-2xl">
              Popular right now
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
            {count > 3 && (
              <p className="mt-6 text-center text-sm text-stone-600">
                <a href="#products" className="font-medium text-forest-600 hover:text-forest-700">
                  See all {count} products →
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
