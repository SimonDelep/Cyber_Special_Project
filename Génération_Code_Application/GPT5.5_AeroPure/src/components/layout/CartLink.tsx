import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart/cookie";

export async function CartLink() {
  const user = await getCurrentUser();
  let count = 0;
  if (user) {
    try {
      count = await getCartItemCount();
    } catch {
      count = 0;
    }
  }

  return (
    <Link
      href={user ? "/cart" : "/login?redirect=/cart"}
      className="relative text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
