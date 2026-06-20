import Link from "next/link";
import { AuthNav } from "@/components/layout/AuthNav";
import { CartLink } from "@/components/cart/CartLink";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Catalog", href: "/catalog" },
  { label: "Shop", href: "/#shop" },
  { label: "Our fibers", href: "/#fibers" },
  { label: "About", href: "/#about" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-sand-200/80 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-sand-900"
        >
          EverThread Co
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm text-sand-700 md:flex"
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-sand-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartLink />
          <Button href="/catalog" variant="secondary" className="hidden lg:inline-flex">
            Catalog
          </Button>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
