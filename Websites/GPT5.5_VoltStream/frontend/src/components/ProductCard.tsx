import { useState } from "react";
import { Link } from "react-router-dom";
import { categoryLabel, formatPrice } from "../api/products";
import { useCart } from "../contexts/CartContext";
import type { Product } from "../types/product";

const categoryIcons: Record<string, string> = {
  keyboard: "⌨️",
  mouse: "🖱️",
  desk_mat: "🎨",
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addItem(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-grid-border bg-grid-surface transition-colors hover:border-grid-cyan/40">
      <Link
        to={`/products/${product.id}`}
        className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-grid-border/50 to-grid-dark p-4"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-5xl" role="img" aria-hidden>
            {categoryIcons[product.category] ?? "🎮"}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-grid-cyan">
          {categoryLabel(product.category)}
        </span>
        <Link to={`/products/${product.id}`}>
          <h3 className="mt-1 font-display text-lg font-bold text-white hover:text-grid-cyan">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 flex-1 text-sm text-grid-muted line-clamp-2">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-white">{formatPrice(product.price_cents)}</span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="rounded-lg border border-grid-cyan/50 px-3 py-1.5 text-sm font-medium text-grid-cyan transition-colors hover:bg-grid-cyan/10 disabled:opacity-50"
          >
            {adding ? "…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
