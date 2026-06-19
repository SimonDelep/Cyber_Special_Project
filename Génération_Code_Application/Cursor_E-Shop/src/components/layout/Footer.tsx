import Link from "next/link";

const footerLinks = [
  { href: "/shop", label: "Shop" },
  { href: "#featured", label: "Featured" },
  { href: "#categories", label: "Categories" },
  { href: "#features", label: "Why E-Shop" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Register" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-bold text-white">
                E
              </span>
              <span className="text-lg font-semibold text-zinc-100">E-Shop</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              Your trusted destination for premium electronics in Canada.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-400 transition hover:text-cyan-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-8 sm:flex-row">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} E-Shop. All rights reserved.
          </p>
          <p className="text-sm text-zinc-600">
            Fast shipping · 2-year warranty · Secure checkout
          </p>
        </div>
      </div>
    </footer>
  );
}
