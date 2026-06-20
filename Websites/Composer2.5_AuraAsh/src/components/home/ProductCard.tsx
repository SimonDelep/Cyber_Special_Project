import Link from "next/link";
import { categoryAccents, categoryLabels } from "@/lib/product-constants";
import { formatPrice } from "@/lib/utils";
import type { ProductItem } from "@/types";

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const accent = categoryAccents[product.category];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone/15 bg-warm-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex size-full flex-col items-center justify-center bg-gradient-to-br ${accent} p-6`}
          >
            <div className="size-16 rounded-full bg-warm-white/40 backdrop-blur-sm" />
            <p className="mt-4 text-center font-display text-lg text-charcoal/80">
              {categoryLabels[product.category]}
            </p>
          </div>
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal px-3 py-1 text-xs font-medium text-cream">
            Featured
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-stone/90 px-3 py-1 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-sage">
          {categoryLabels[product.category]}
        </p>
        <h3 className="mt-1 font-display text-xl text-charcoal">{product.name}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-stone">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-medium text-charcoal">
            {formatPrice(product.price)}
          </span>
          <Link
            href={`/shop/${product.slug}`}
            className="text-sm font-medium text-ember transition-colors hover:text-ember-dark"
          >
            View &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
