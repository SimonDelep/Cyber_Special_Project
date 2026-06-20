import { addToCart } from '@/stores/cart-actions';

interface Props {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function AddToCartButton(props: Props) {
  const handleClick = () => {
    addToCart({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      price: props.price,
      imageUrl: props.imageUrl,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="rounded-full bg-luna-800 px-4 py-2 text-sm font-medium text-luna-50 transition-colors hover:bg-luna-700"
    >
      Add to cart
    </button>
  );
}
