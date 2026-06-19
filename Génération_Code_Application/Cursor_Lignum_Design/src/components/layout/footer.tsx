import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl font-semibold">{siteConfig.name}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Navigation
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#collections" className="text-sm hover:text-accent-light">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="#craftsmanship" className="text-sm hover:text-accent-light">
                  Artisanat
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-sm hover:text-accent-light">
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={`mailto:${siteConfig.links.email}`} className="hover:text-accent-light">
                  {siteConfig.links.email}
                </a>
              </li>
              <li className="text-stone-400">Montréal, Québec</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-stone-800 pt-8 text-center text-sm text-stone-500">
          © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
