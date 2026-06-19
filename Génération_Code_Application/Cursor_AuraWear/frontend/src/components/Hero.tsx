import { Link } from "react-router-dom";
import ChicoutimiWeatherCard from "./ChicoutimiWeather";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-aura-200">
      <div className="absolute inset-0 bg-gradient-to-br from-aura-100 via-aura-50 to-aura-200/40" aria-hidden />
      <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-aura-300/30 blur-3xl" aria-hidden />
      <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-aura-400/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(280px,320px)] lg:gap-12">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-aura-600">
            Spring / Summer 2026
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-aura-950 sm:text-5xl lg:text-6xl">
            Wear your aura.
            <span className="block text-aura-600">Elevated essentials.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-aura-700">
            Discover thoughtfully crafted clothing designed for comfort, confidence, and everyday
            style. Quality fabrics, timeless silhouettes.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#shop"
              className="inline-flex items-center justify-center rounded-full bg-aura-950 px-8 py-3.5 text-sm font-semibold text-aura-50 shadow-lg shadow-aura-950/10 transition hover:bg-aura-800"
            >
              Shop new arrivals
            </a>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center rounded-full border border-aura-300 bg-white/60 px-8 py-3.5 text-sm font-semibold text-aura-800 backdrop-blur transition hover:border-aura-400 hover:bg-white"
            >
              Browse catalog
            </Link>
          </div>
        </div>
        <ChicoutimiWeatherCard />
        </div>
      </div>
    </section>
  );
}
