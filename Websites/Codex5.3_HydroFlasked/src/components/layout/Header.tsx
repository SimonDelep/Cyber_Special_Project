import Link from "next/link";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CartLink } from "@/components/cart/CartLink";
import { getSessionUser, isAdmin } from "@/lib/auth/session";

const navLinks = [
  { href: "/shop", label: "Catalog" },
  { href: "/#hydration-weather", label: "Weather" },
  { href: "/#featured", label: "Featured" },
  { href: "/#categories", label: "Categories" },
];

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Hydro<span className="text-brand-400">Flasked</span>
        </Link>
        <nav className="hidden items-center gap-8 sm:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {user && isAdmin(user) ? (
            <Link
              href="/admin"
              className="text-sm text-brand-400 transition hover:text-brand-300"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-4">
          <CartLink />
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-slate-200 transition hover:text-white"
              >
                <UserAvatar
                  src={user.profileImageUrl}
                  alt={user.displayName || user.username}
                  size={32}
                />
                <span className="hidden sm:inline">
                  {user.displayName || user.username}
                </span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-400"
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
