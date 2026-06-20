import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/format";

const categoryGradients: Record<string, string> = {
  women: "from-rose-200/80 to-aura-200",
  men: "from-slate-300/80 to-aura-300",
  accessories: "from-amber-200/80 to-aura-200",
  general: "from-aura-200 to-aura-300",
};

interface ProductCardProps {
  product: Product;
  showDetailsLink?: boolean;
}

export default function ProductCard({ product, showDetailsLink = true }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const gradient = categoryGradients[product.category] ?? categoryGradients.general;
  const outOfStock = product.stock <= 0;

  function handleAddToCart() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-aura-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/catalog/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-aura-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient}`}
            role="img"
            aria-label={product.name}
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-aura-800 backdrop-blur">
          {product.category}
        </span>
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-aura-950/80 px-2.5 py-1 text-xs font-semibold text-aura-50">
            Sold out
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <Link to={`/catalog/${product.id}`}>
          <h3 className="font-display text-xl font-semibold text-aura-950 hover:text-aura-700">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-aura-600">{product.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-aura-950">{formatCurrency(product.price)}</p>
          {!outOfStock && (
            <span className="text-xs text-aura-500">{product.stock} in stock</span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className="flex-1 rounded-full bg-aura-950 py-2.5 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:cursor-not-allowed disabled:bg-aura-300"
          >
            {outOfStock ? "Unavailable" : added ? "Added ✓" : "Add to cart"}
          </button>
          {showDetailsLink && (
            <Link
              to={`/catalog/${product.id}`}
              className="flex-1 rounded-full border border-aura-300 py-2.5 text-center text-sm font-semibold text-aura-800 transition hover:border-aura-400 hover:bg-aura-50"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
