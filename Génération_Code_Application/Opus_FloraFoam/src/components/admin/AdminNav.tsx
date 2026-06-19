"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/products", label: "Products", exact: false },
  { href: "/admin/logs", label: "System log", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-sage-200/80 pb-4"
      aria-label="Admin"
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-sage-700 text-cream-50"
                : "text-sage-700 hover:bg-sage-100 hover:text-sage-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
