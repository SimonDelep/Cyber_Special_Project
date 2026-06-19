import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Product } from "../types/product";
import LandscapeInspiration from "./LandscapeInspiration";
import Navbar from "./Navbar";

const collections = [
  {
    title: "Landscape Prints",
    description: "Museum-grade print-on-demand canvases of mist, peaks, and open sky.",
    tag: "canvas-prints",
  },
  {
    title: "Vintage Mood",
    description: "Soft grain, faded tones, and timeless horizons for quiet rooms.",
    tag: "vintage-prints",
  },
  {
    title: "Gallery Sets",
    description: "Curated triptychs and framed sets, ready to hang as one story.",
    tag: "gallery-sets",
  },
];

function formatCategory(category: string) {
  return category.replace(/-/g, " ");
}

export default function LandingPage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts()
      .then((items) => setFeatured(items.slice(0, 3)))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />

      <main>
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fog/20 via-ink to-ink"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-fog), transparent),
                linear-gradient(180deg, transparent 60%, var(--color-ink))
              `,
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-fog">
              Print-on-demand wall art
            </p>
            <h1 className="font-display text-5xl leading-tight text-mist md:text-7xl">
              Landscapes that
              <span className="block italic text-gold">linger in the room</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-mist/70">
              High-quality landscape prints, moody vintage editions, and framed
              canvas gallery sets — made to order, shipped to your wall.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/catalog"
                className="rounded-sm bg-gold px-8 py-3 text-sm font-medium text-ink transition hover:bg-gold/90"
              >
                Browse catalog
              </Link>
              <Link
                to="/register"
                className="rounded-sm border border-mist/30 px-8 py-3 text-sm transition hover:border-mist/60"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        <section id="shop" className="border-t border-white/5 bg-deep px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-4xl text-mist">Product catalog</h2>
                <p className="mt-2 max-w-lg text-mist/60">
                  Search by name, filter by category and price, read customer
                  reviews, and share your own — with optional photos.
                </p>
              </div>
              <Link
                to="/catalog"
                className="shrink-0 rounded-sm border border-gold/40 px-6 py-3 text-sm transition hover:border-gold hover:bg-gold/10"
              >
                Open full catalog →
              </Link>
            </div>

            {loading ? (
              <p className="mt-12 text-center text-mist/50">Loading highlights…</p>
            ) : featured.length === 0 ? (
              <p className="mt-12 text-center text-mist/50">
                <Link to="/catalog" className="text-gold hover:underline">
                  Explore the catalog
                </Link>
              </p>
            ) : (
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((product) => (
                  <Link
                    key={product.id}
                    to={`/catalog/${product.slug}`}
                    className="group flex flex-col overflow-hidden rounded-sm border border-white/5 bg-ink transition hover:border-gold/30"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-mist/30">
                          No image
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 text-xs uppercase tracking-wider text-fog backdrop-blur-sm">
                        {formatCategory(product.category)}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-xl text-gold group-hover:text-mist transition">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-lg font-medium text-gold">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="collections" className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-4xl text-mist">Collections</h2>
            <p className="mt-2 max-w-lg text-mist/60">
              Three curated lines for every mood — from dramatic peaks to soft,
              vintage horizons.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {collections.map((item) => (
                <Link
                  key={item.tag}
                  to={`/catalog?category=${item.tag}`}
                  className="group rounded-sm border border-white/5 bg-deep/50 p-8 transition hover:border-gold/30"
                >
                  <span className="text-xs uppercase tracking-widest text-fog">
                    {item.tag}
                  </span>
                  <h3 className="mt-3 font-display text-2xl text-gold group-hover:text-mist transition">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist/60">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <LandscapeInspiration />

        <section id="about" className="px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-4xl text-mist">VistaCanvas</h2>
              <p className="mt-6 leading-relaxed text-mist/70">
                We believe a single landscape can change how a room feels. Every
                piece is printed on demand with archival inks and premium
                materials — no mass inventory, no compromise on quality.
              </p>
            </div>
            <div
              id="craft"
              className="rounded-sm border border-white/5 bg-panel/5 p-8 text-mist/80"
            >
              <h3 className="font-display text-xl text-gold">Craft & quality</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>— Archival pigment inks, fade-resistant</li>
                <li>— Solid wood frames on gallery sets</li>
                <li>— Hand-inspected before shipping</li>
                <li>— Carbon-neutral packaging (coming soon)</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-mist/40">
        <p>© {new Date().getFullYear()} VistaCanvas. All rights reserved.</p>
      </footer>
    </div>
  );
}
