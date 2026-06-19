import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { navLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

export async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/profile"
                className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-flex"
              >
                Mon profil
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-flex"
                >
                  Admin
                </Link>
              ) : null}
              <form action="/logout" method="post" className="hidden sm:block">
                <button
                  type="submit"
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border/40"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border/40 sm:inline-flex"
            >
              Connexion
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Panier"
            className="rounded-full p-2 text-foreground transition-colors hover:bg-border/50"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            className="rounded-full p-2 text-foreground transition-colors hover:bg-border/50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="#collections"
            className={cn(
              "hidden rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background",
              "transition-opacity hover:opacity-90 sm:inline-flex",
            )}
          >
            Découvrir
          </Link>
        </div>
      </div>
    </header>
  );
}
