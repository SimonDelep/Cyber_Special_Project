import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Product, ProductCategory } from "@prisma/client";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";

type CatalogItem = {
  id?: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  inStock?: boolean;
};

const PLACEHOLDER_PRODUCTS: CatalogItem[] = [
  {
    slug: "radiance-botanical-serum",
    name: "Radiance Botanical Serum",
    category: "SERUM",
    description:
      "Vitamin-rich plant serum for a luminous, even-toned complexion.",
    priceCents: 6800,
    imageUrl: null,
  },
  {
    slug: "calm-roots-balancing-serum",
    name: "Calm Roots Balancing Serum",
    category: "SERUM",
    description: "Centella and licorice root to calm and balance sensitive skin.",
    priceCents: 7200,
    imageUrl: null,
  },
  {
    slug: "cell-renewal-night-cream",
    name: "Cell Renewal Night Cream",
    category: "NIGHT_CREAM",
    description: "Exosome-infused overnight repair cream.",
    priceCents: 8900,
    imageUrl: null,
  },
  {
    slug: "velvet-leaf-barrier-cream",
    name: "Velvet Leaf Barrier Cream",
    category: "NIGHT_CREAM",
    description: "Plant ceramide cream that strengthens your moisture barrier.",
    priceCents: 8400,
    imageUrl: null,
  },
  {
    slug: "dew-drop-eye-patches",
    name: "Dew Drop Eye Patches",
    category: "EYE_PATCH",
    description: "Cooling botanical patches for tired, puffy eyes.",
    priceCents: 3200,
    imageUrl: null,
  },
  {
    slug: "golden-hour-brightening-patches",
    name: "Golden Hour Brightening Patches",
    category: "EYE_PATCH",
    description: "Vitamin C hydrogel patches for a brighter under-eye area.",
    priceCents: 3600,
    imageUrl: null,
  },
];

type FeaturedProductsProps = {
  products: Product[];
};

function ProductCard({
  product,
  isLoggedIn,
}: {
  product: CatalogItem;
  isLoggedIn: boolean;
}) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-sage-200/80 bg-cream-50 transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sage-100 via-rose-200/40 to-sage-200">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sage-900/50 to-transparent p-6 pt-16">
          <span className="rounded-full bg-cream-50/95 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sage-700">
            {CATEGORY_LABELS[product.category]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold text-sage-900">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-sage-600 line-clamp-3">
          {product.description}
        </p>
        <p className="mt-4 text-lg font-medium text-sage-800">
          {formatPrice(product.priceCents)}
        </p>
        <div className="mt-4 space-y-2">
          {product.id ? (
            <>
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                inStock={product.inStock ?? true}
                isLoggedIn={isLoggedIn}
              />
              <Link
                href={`/products/${product.slug}`}
                className="block w-full rounded-full border border-sage-300 py-2.5 text-center text-sm font-medium text-sage-800 hover:bg-sage-50"
              >
                Details & reviews
              </Link>
            </>
          ) : (
            <p className="text-center text-xs text-sage-500">Run db:seed to enable cart</p>
          )}
        </div>
      </div>
    </li>
  );
}

export async function FeaturedProducts({ products }: FeaturedProductsProps) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const fromDb = products.length > 0;
  const displayItems: CatalogItem[] = fromDb
    ? products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        inStock: p.inStock,
      }))
    : PLACEHOLDER_PRODUCTS;

  return (
    <section id="products" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-sage-900 sm:text-4xl">
              Our collection
            </h2>
            <p className="mt-2 max-w-xl text-sage-600">
              {fromDb
                ? `${displayItems.length} plant-based essentials—serums, night creams, and botanical eye patches crafted for your daily ritual.`
                : "Serums, night creams, and eye patches—our essentials for a complete ritual."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {fromDb && (
              <Link
                href="/products"
                className="text-sm font-medium text-sage-800 hover:text-sage-900"
              >
                View full catalog →
              </Link>
            )}
            {!fromDb && (
              <p className="text-sm text-rose-400">
                Run{" "}
                <code className="rounded bg-sage-100 px-1.5 py-0.5 text-sage-800">npm run db:seed</code>{" "}
                after starting the database to load live products.
              </p>
            )}
          </div>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((product) => (
            <ProductCard
              key={product.id ?? product.slug}
              product={product}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
