import Link from "next/link";
import { auth } from "@/auth";
import { getCartItemCount } from "@/lib/cart";

export async function CartLink() {
  const session = await auth();
  const count =
    session?.user?.id != null
      ? await getCartItemCount(session.user.id)
      : 0;

  return (
    <Link
      href={session?.user ? "/cart" : "/login?callbackUrl=/cart"}
      className="relative flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-2 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        suppressHydrationWarning
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l1.383 5.14M7.5 14.25h9.75m-9.75 0L6.106 5.272M7.5 14.25l-1.47 4.41a1.125 1.125 0 001.06 1.47h10.718a1.125 1.125 0 001.06-1.47L16.5 14.25m-9.75 0h9.75M9.75 21a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm9 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-xs font-bold text-zinc-950">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
