import Link from "next/link";

import { CartNavLink } from "@/components/cart/CartNavLink";
import { HeaderAuth } from "@/components/layout/HeaderAuth";

const navLinks = [
  { label: "Catalog", href: "/catalog" },
  { label: "Coffee", href: "/catalog?category=COFFEE" },
  { label: "Tea", href: "/catalog?category=TEA" },
  { label: "Subscriptions", href: "/#subscriptions" },
  { label: "Our Story", href: "/#story" },
  { label: "Chicoutimi", href: "/#chicoutimi" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-sage/20 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-espresso"
        >
          Roast<span className="text-sage-dark">Ritual</span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-espresso/80 transition-colors hover:text-espresso"
            >
              {link.label}
            </Link>
          ))}
          <CartNavLink />
        </nav>

        <HeaderAuth />
      </div>
    </header>
  );
}
