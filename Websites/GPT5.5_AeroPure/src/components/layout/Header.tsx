import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { UserMenu } from "@/components/layout/UserMenu";
import { CartLink } from "@/components/layout/CartLink";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <CartLink />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
