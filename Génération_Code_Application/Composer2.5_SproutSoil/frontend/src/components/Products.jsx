import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../api/client";
import { useCart } from "../context/CartContext";

const categoryLabels = {
  "herb-garden-kits": "Herb Garden Kits",
  planters: "Planters",
  "nutrient-mists": "Nutrient Mists",
};

const categoryIcons = {
  "herb-garden-kits": "🌱",
  planters: "🏺",
  "nutrient-mists": "💧",
};

const fallbackProducts = [
  {
    id: 1,
    name: "Smart Herb Garden Kit",
    slug: "smart-herb-garden-kit",
    description:
      "Grow basil, mint, and thyme year-round with built-in LED grow lights and app-controlled watering.",
    price: "89.99",
    category: "herb-garden-kits",
    image_url:
      "https://images.unsplash.com/photo-1466692476869-aef1dfb1e735?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Compact Desktop Garden",
    slug: "compact-desktop-garden",
    description:
      "Space-saving smart garden for kitchen counters — perfect for parsley, chives, and microgreens.",
    price: "64.99",
    category: "herb-garden-kits",
    image_url:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Self-Watering Ceramic Planter",
    slug: "self-watering-ceramic-planter",
    description:
      "Handcrafted ceramic planter with a hidden reservoir that keeps herbs hydrated for up to two weeks.",
    price: "54.99",
    category: "planters",
    image_url:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d826?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Premium Terracotta Planter Set",
    slug: "premium-terracotta-planter-set",
    description:
      "Set of three breathable terracotta pots with matching saucers — ideal for rosemary, sage, and oregano.",
    price: "42.99",
    category: "planters",
    image_url:
      "https://images.unsplash.com/photo-1592150621744-aca64f483902?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Plant Nutrient Mist — Herb Blend",
    slug: "plant-nutrient-mist-herb-blend",
    description:
      "Fine-mist formula enriched with micronutrients tailored for indoor culinary herbs.",
    price: "18.99",
    category: "nutrient-mists",
    image_url:
      "https://images.unsplash.com/photo-1628556270448-7c3ef53b3c2f?w=600&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Plant Nutrient Mist — Citrus & Mint",
    slug: "plant-nutrient-mist-citrus-mint",
    description:
      "Brightening mist blend for lemon balm, mint, and other aromatic indoor herbs.",
    price: "19.99",
    category: "nutrient-mists",
    image_url:
      "https://images.unsplash.com/photo-1530836368580-856a9d333be8?w=600&h=400&fit=crop",
  },
];

function ProductImage({ product }) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    );
  }

  return (
    <span className="text-5xl" aria-hidden>
      {categoryIcons[product.category] ?? "🌿"}
    </span>
  );
}

export default function Products() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.length > 0) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="products" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sprout-600">
            Shop the collection
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-soil-950">
            Our Products
          </h2>
          <p className="mt-4 text-soil-600">
            Six essentials for your indoor herb garden — smart kits, self-watering
            planters, and nutrient mists to keep every leaf thriving.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-2xl bg-soil-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-soil-200 bg-soil-50 transition-all hover:border-sprout-400/50 hover:shadow-lg hover:shadow-sprout-500/10"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-soil-100 to-soil-200">
                  <ProductImage product={product} />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <span className="mb-2 inline-block w-fit rounded-full bg-sprout-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-sprout-600">
                    {categoryLabels[product.category] ?? product.category}
                  </span>

                  <Link
                    to={`/catalog/${product.slug}`}
                    className="font-display text-xl font-bold text-soil-900 group-hover:text-sprout-600 transition-colors"
                  >
                    {product.name}
                  </Link>

                  <p className="mt-2 flex-1 text-sm text-soil-600 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-2xl font-bold text-soil-900">
                      {formatMoney(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product);
                        setAddedId(product.id);
                        setTimeout(() => setAddedId(null), 1500);
                      }}
                      className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium text-white transition-colors ${
                        addedId === product.id
                          ? "bg-sprout-500"
                          : "bg-soil-800 hover:bg-sprout-600"
                      }`}
                    >
                      {addedId === product.id ? "Added!" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-12 text-center">
            <Link
              to="/catalog"
              className="inline-block rounded-full border border-soil-200 bg-white px-8 py-3 text-sm font-semibold text-soil-800 hover:border-sprout-400 hover:text-sprout-600 transition-colors"
            >
              View full catalog with search & filters
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
