import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-wood-dark py-20 text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <div>
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            Prêt à transformer votre espace ?
          </h2>
          <p className="mt-3 max-w-lg text-stone-300">
            Parcourez nos collections ou contactez-nous pour un projet sur mesure.
          </p>
        </div>
        <Link
          href="#collections"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-8 py-3.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
        >
          Explorer le catalogue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
