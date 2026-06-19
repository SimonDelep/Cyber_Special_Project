import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/profile/actions";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { getCartItemCount } from "@/lib/cart";

const navLinks = [
  { href: "/products", label: "Catalog" },
  { href: "/#products", label: "Featured" },
  { href: "/#values", label: "Our Promise" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const cartCount = user?.id ? await getCartItemCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-sage-200/60 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-sage-900"
        >
          Flora<span className="text-sage-500">Foam</span>
        </Link>
        <nav className="hidden items-center gap-8 sm:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-sage-700 transition-colors hover:text-sage-900"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-sage-700 transition-colors hover:text-sage-900"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-sage-700 hover:text-sage-900 sm:hidden"
            >
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/cart"
                className="relative rounded-full px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-100 hover:text-sage-900"
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sage-700 px-1 text-xs font-medium text-cream-50">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-sage-800 transition-colors hover:bg-sage-100"
              >
                <UserAvatar
                  name={user.name ?? user.username}
                  imageUrl={user.image}
                  size="sm"
                />
                <span className="hidden sm:inline">{user.name ?? user.username}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="hidden rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50 sm:inline-block"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-sage-700 hover:text-sage-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-sage-700 px-5 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-sage-900"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
