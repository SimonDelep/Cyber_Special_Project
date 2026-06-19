import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CartLink } from "@/components/cart/CartLink";
import { Role } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Candles", href: "/shop/candles" },
  { label: "Incense Holders", href: "/shop/incense-holders" },
  { label: "Diffusers", href: "/shop/diffusers" },
  { label: "About", href: "/about" },
];

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-stone/15 bg-warm-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-1">
          <span className="font-display text-2xl font-semibold tracking-tight text-charcoal">
            Aura
          </span>
          <span className="font-display text-2xl font-light tracking-tight text-ember">
            Ash
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ash transition-colors hover:text-ember"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === Role.ADMIN && (
            <Link
              href="/admin"
              className="text-sm font-medium text-sage transition-colors hover:text-charcoal"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-ash transition-colors hover:text-ember"
              >
                {user.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profilePicture}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-cream text-xs font-semibold text-charcoal">
                    {user.username[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-ash transition-colors hover:text-ember"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={cn(
                  "rounded-full bg-charcoal px-5 py-2 text-sm font-medium text-cream",
                  "transition-colors hover:bg-ash",
                )}
              >
                Register
              </Link>
            </div>
          )}

          <CartLink />
        </div>
      </div>
    </header>
  );
}
