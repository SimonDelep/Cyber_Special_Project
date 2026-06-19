import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";

const categoryAccent: Record<ProductCardData["category"], string> = {
  COFFEE: "from-espresso via-espresso-light to-sage-dark",
  TEA: "from-sage-dark via-sage to-sage-light",
};

const categoryLabel: Record<ProductCardData["category"], string> = {
  COFFEE: "Whole bean coffee",
  TEA: "Loose-leaf tea",
};

function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-3xl border border-sage/25 bg-cream shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
      <div className="relative h-48 w-full overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${categoryAccent[product.category]}`}
            aria-hidden
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-espresso">
          {product.category === "COFFEE" ? "Coffee" : "Tea"}
        </span>
        {product.isEthical && (
          <span className="absolute right-4 top-4 rounded-full bg-sage-dark/90 px-3 py-1 text-xs font-medium text-cream">
            Ethical
          </span>
        )}
      </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs uppercase tracking-widest text-sage-dark">
          {categoryLabel[product.category]}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-display text-xl text-espresso hover:text-sage-dark">
            {product.name}
          </h3>
        </Link>
        {(product.origin || product.roastLevel) && (
          <p className="mt-1 text-sm text-espresso/60">
            {[product.origin, product.roastLevel].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-espresso/70 line-clamp-3">
          {product.description}
        </p>
        <p className="mt-4 text-2xl font-semibold text-espresso">
          {formatCents(product.priceCents)}
        </p>
        <AddToCartButton
          product={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
    </li>
  );
}

type ProductGridProps = {
  products: ProductCardData[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const coffee = products.filter((p) => p.category === "COFFEE");
  const tea = products.filter((p) => p.category === "TEA");

  return (
    <section
      id="products"
      className="scroll-mt-20 bg-cream px-6 py-20"
      aria-labelledby="products-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="products-heading"
          className="font-display text-center text-3xl text-espresso md:text-4xl"
        >
          Shop our collection
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-espresso/70">
          Specialty whole-bean coffees and loose-leaf herbal teas — ethically
          sourced and roasted or blended in small batches.
        </p>
        <div className="mt-6 text-center">
          <Button href="/catalog" variant="secondary">
            View full catalog with search & filters
          </Button>
        </div>

        {coffee.length > 0 && (
          <div className="mt-14">
            <h3
              id="coffee"
              className="scroll-mt-24 font-display text-2xl text-espresso"
            >
              Coffee
            </h3>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {coffee.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ul>
          </div>
        )}

        {tea.length > 0 && (
          <div className="mt-16">
            <h3
              id="tea"
              className="scroll-mt-24 font-display text-2xl text-espresso"
            >
              Herbal tea
            </h3>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tea.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
