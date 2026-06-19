import Image from "next/image";
import { values } from "@/config/site";

export function CraftsmanshipSection() {
  return (
    <section id="craftsmanship" className="border-y border-border bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80"
              alt="Artisan travaillant le bois dans un atelier"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Savoir-faire
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Du bois à votre intérieur
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Dans notre atelier montréalais, nous transformons des planches brutes en meubles
              d&apos;exception. Chaque assemblage, chaque finition est réalisé à la main pour
              garantir une qualité qui se ressent au toucher.
            </p>

            <ul className="mt-10 space-y-8">
              {values.map((value) => (
                <li key={value.title}>
                  <h3 className="font-serif text-xl font-semibold">{value.title}</h3>
                  <p className="mt-2 text-muted">{value.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
