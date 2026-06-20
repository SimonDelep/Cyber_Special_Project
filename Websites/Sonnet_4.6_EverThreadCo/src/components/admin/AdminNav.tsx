"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/logs", label: "System logs" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-sand-200 pb-4"
      aria-label="Admin"
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-sand-900 text-cream-50"
                : "bg-cream-100 text-sand-700 hover:bg-sand-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="ml-auto self-center text-sm text-sage-700 hover:text-sage-900"
      >
        ← Store
      </Link>
    </nav>
  );
}
