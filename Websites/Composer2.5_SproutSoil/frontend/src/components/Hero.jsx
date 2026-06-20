import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../api/client";

const featuredFallback = [
  {
    id: 1,
    name: "Smart Herb Garden Kit",
    price: "89.99",
    image_url:
      "https://images.unsplash.com/photo-1466692476869-aef1dfb1e735?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Self-Watering Ceramic Planter",
    price: "54.99",
    image_url:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d826?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    name: "Plant Nutrient Mist — Herb Blend",
    price: "18.99",
    image_url:
      "https://images.unsplash.com/photo-1628556270448-7c3ef53b3c2f?w=400&h=300&fit=crop",
  },
];

export default function Hero() {
  const [featured, setFeatured] = useState(featuredFallback);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.length >= 3) setFeatured(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sprout-400/10 via-soil-100 to-soil-200/40" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sprout-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-soil-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-sprout-600 shadow-sm ring-1 ring-soil-200">
              <span className="h-2 w-2 rounded-full bg-sprout-500 animate-pulse" />
              6 products · Fresh herbs, zero guesswork
            </p>

            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight text-soil-950 tracking-tight">
              Grow a thriving indoor garden,{" "}
              <span className="text-sprout-600">effortlessly</span>
            </h1>

            <p className="mt-6 text-lg text-soil-600 leading-relaxed max-w-xl">
              SproutSoil brings smart herb garden kits, self-watering ceramic
              planters, and specialized nutrient mists together — so your kitchen
              always has fresh basil, mint, and thyme.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="rounded-full bg-sprout-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sprout-500/25 hover:bg-sprout-600 transition-all hover:shadow-xl hover:shadow-sprout-500/30"
              >
                Browse catalog
              </Link>
              <a
                href="#features"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-soil-700 ring-1 ring-soil-200 hover:ring-soil-300 transition-all"
              >
                Learn More
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: "6", label: "Curated products" },
                { value: "30+", label: "Herb varieties" },
                { value: "4.9★", label: "Average rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="font-display text-2xl font-bold text-soil-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-soil-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-soil-500">
              Featured picks
            </p>
            <div className="grid gap-4">
              {featured.map((product) => (
                <a
                  key={product.id}
                  href="#products"
                  className="group flex items-center gap-4 rounded-2xl border border-soil-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm transition-all hover:border-sprout-400/50 hover:shadow-md"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-soil-100 text-2xl">
                      🌿
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-soil-900 group-hover:text-sprout-600">
                      {product.name}
                    </p>
                    <p className="text-sm font-semibold text-sprout-600">
                      {formatMoney(product.price)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
