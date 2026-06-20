import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sage/20 bg-espresso text-cream/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-cream">RoastRitual</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            Ethically sourced whole-bean coffees and loose-leaf herbal teas,
            delivered on your schedule.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6 text-sm" aria-label="Footer">
          <Link href="#subscriptions" className="hover:text-cream">
            Subscriptions
          </Link>
          <Link href="#story" className="hover:text-cream">
            Sustainability
          </Link>
          <Link href="#" className="hover:text-cream">
            Contact
          </Link>
        </nav>
      </div>

      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {year} RoastRitual. All rights reserved.
      </div>
    </footer>
  );
}
