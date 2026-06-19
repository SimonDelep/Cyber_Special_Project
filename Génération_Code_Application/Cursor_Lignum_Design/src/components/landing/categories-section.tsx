import Image from "next/image";
import Link from "next/link";
import { featuredCategories } from "@/config/site";

export function CategoriesSection() {
  return (
    <section id="collections" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Collections</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Chaque pièce, une pièce maîtresse
          </h2>
          <p className="mt-4 text-lg text-muted">
            Explorez nos collections pensées pour transformer votre intérieur en un espace chaleureux
            et durable.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCategories.map((category) => (
            <Link
              key={category.name}
              href="#"
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-2xl font-semibold">{category.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
