import Link from "next/link";

const footerLinks = {
  Shop: [
    { label: "Candles", href: "/shop/candles" },
    { label: "Incense Holders", href: "/shop/incense-holders" },
    { label: "Diffusers", href: "/shop/diffusers" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Shipping", href: "/shipping" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-stone/15 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-1">
              <span className="font-display text-2xl font-semibold text-charcoal">
                Aura
              </span>
              <span className="font-display text-2xl font-light text-ember">
                Ash
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone">
              Handcrafted home fragrance for mindful moments. Soy wax candles,
              concrete incense holders, and essential oil diffusers — made with
              intention.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
                {title}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone transition-colors hover:text-ember"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone/15 pt-8 sm:flex-row">
          <p className="text-xs text-stone">
            &copy; {new Date().getFullYear()} AuraAsh. All rights reserved.
          </p>
          <p className="text-xs text-stone">Hand-poured with care in Canada</p>
        </div>
      </div>
    </footer>
  );
}
