import { formatPrice } from "@/lib/format";
import { addToCart } from "@/stores/cart";

export type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string;
  stackable: boolean;
  leakProof: boolean;
};

type Props = {
  product: ProductCardData;
};

export default function ProductCard(props: Props) {
  const { product } = props;

  function handleAdd() {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
    });
  }

  return (
    <article class="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <div class="aspect-square bg-gradient-to-br from-brand-50 to-white p-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          class="h-full w-full object-contain transition group-hover:scale-[1.02]"
          width={320}
          height={320}
          loading="lazy"
        />
      </div>
      <div class="flex flex-1 flex-col p-5">
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-800">
            {product.category.replace("-", " ")}
          </span>
          {product.stackable && (
            <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-muted">
              Stackable
            </span>
          )}
          {product.leakProof && (
            <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-muted">
              Leak-proof
            </span>
          )}
        </div>
        <h3 class="mt-3 font-semibold text-ink">
          <a href={`/products/${product.slug}`} class="hover:text-brand-700">
            {product.name}
          </a>
        </h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-2">
          {product.description}
        </p>
        <div class="mt-4 flex items-center justify-between gap-3">
          <span class="text-lg font-semibold text-brand-800">
            {formatPrice(product.priceCents)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            class="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
