import Link from "next/link";
import { auth } from "@/auth";
import { addToCartAction } from "@/actions/cart";

interface AddToCartButtonProps {
  productId: string;
  className?: string;
}

export async function AddToCartButton({
  productId,
  className = "",
}: AddToCartButtonProps) {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=/shop`}
        className={`inline-flex items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300 ${className}`}
      >
        Sign in to add
      </Link>
    );
  }

  return (
    <form action={addToCartAction.bind(null, productId)}>
      <button
        type="submit"
        className={`inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 ${className}`}
      >
        Add to cart
      </button>
    </form>
  );
}
