import { createSignal } from 'solid-js';
import { addToCart } from '../../stores/cart';

interface Props {
  productId: number;
  name: string;
  priceCents: number;
}

export default function AddToCartButton(props: Props) {
  const [added, setAdded] = createSignal(false);

  const handleClick = () => {
    const ok = addToCart({
      productId: Number(props.productId),
      name: String(props.name),
      priceCents: Number(props.priceCents),
    });

    if (ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-nest-950"
    >
      {added() ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  );
}
