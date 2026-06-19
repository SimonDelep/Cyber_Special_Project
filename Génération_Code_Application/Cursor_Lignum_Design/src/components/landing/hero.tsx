import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1920&q=80"
          alt="Intérieur chaleureux avec mobilier en bois"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Artisanat québécois
        </p>
        <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Le mobilier qui raconte une histoire
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Lignum Design crée des pièces uniques en bois massif — tables, chaises et rangements
          conçus pour durer des générations.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="#collections"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Voir les collections
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#craftsmanship"
            className="inline-flex items-center rounded-full border border-border bg-surface/80 px-8 py-3.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-surface"
          >
            Notre savoir-faire
          </Link>
        </div>
      </div>
    </section>
  );
}
