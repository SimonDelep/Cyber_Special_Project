import { useState } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";

const categoryLabels: Record<string, string> = {
  "oral-care": "Oral care",
  "personal-care": "Personal care",
  household: "Household",
};

const categoryEmoji: Record<string, string> = {
  "oral-care": "🪥",
  "personal-care": "🧼",
  household: "✨",
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(price));
}

export default function ProductCard({
  product,
  linkable = false,
}: {
  product: Product;
  linkable?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-forest-200/80 bg-white shadow-sm transition hover:border-forest-300 hover:shadow-md ${linkable ? "pointer-events-none" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-forest-100 to-forest-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-60">
            {categoryEmoji[product.category] ?? "🌿"}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-forest-700 backdrop-blur-sm">
          {categoryLabels[product.category] ?? product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-forest-800 leading-snug">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600 line-clamp-3">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold text-forest-700">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }}
            className={`shrink-0 rounded-full bg-forest-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-700 ${linkable ? "pointer-events-auto" : ""}`}
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
