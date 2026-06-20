import { addToCart } from '@/stores/cart';

type Props = {
  productId: number;
  name: string;
  priceCents: number;
};

export default function AddToCartButton(props: Props) {
  return (
    <button
      type="button"
      class="w-full rounded-full border border-cork-400 bg-transparent px-4 py-2.5 text-sm font-medium text-cork-800 transition-colors hover:bg-cork-800 hover:text-cork-50"
      onClick={() =>
        addToCart({
          productId: props.productId,
          name: props.name,
          priceCents: props.priceCents,
        })
      }
    >
      Add to cart
    </button>
  );
}
