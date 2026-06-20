import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
};

function clampTake(v: unknown, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(24, Math.floor(n)));
}

export async function ProductsShowcase({ searchParams }: { searchParams?: SearchParams }) {
  const q = (searchParams?.q ?? "").trim();
  const category = (searchParams?.category ?? "").trim();
  const sort = (searchParams?.sort ?? "newest").trim();

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy:
        sort === "price_asc"
          ? { price: "asc" as const }
          : sort === "price_desc"
            ? { price: "desc" as const }
            : { createdAt: "desc" as const },
      take: clampTake(process.env.HOMEPAGE_PRODUCTS_TAKE, 8),
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAt: true,
        featured: true,
        images: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <section id="collections" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Explorer nos produits
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Recherchez rapidement une pièce, filtrez par catégorie et découvrez nos nouveautés.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex self-start rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition-colors hover:bg-border/40 lg:self-auto"
          >
            Voir tout le catalogue
          </Link>
        </div>

        <form method="get" className="mt-10 rounded-2xl border border-border bg-surface p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <label className="space-y-1 lg:col-span-3">
              <span className="text-sm font-medium">Recherche</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Table, chaise, noyer..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-1 lg:col-span-2">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                name="category"
                defaultValue={category}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Toutes</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 lg:col-span-1">
              <span className="text-sm font-medium">Tri</span>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="newest">Nouveautés</option>
                <option value="price_asc">Prix ↑</option>
                <option value="price_desc">Prix ↓</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {products.length} produit{products.length === 1 ? "" : "s"} affiché
              {products.length === 1 ? "" : "s"}.
            </p>
            <div className="flex gap-3">
              <Link
                href="/#collections"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-border/40"
              >
                Réinitialiser
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Appliquer
              </button>
            </div>
          </div>
        </form>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const image = p.images?.[0];
            const price = Number(p.price);
            const compareAt = p.compareAt ? Number(p.compareAt) : null;

            return (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-border/30">
                  {image ? (
                    <Image
                      src={image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {p.category.name}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight">{p.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{formatPrice(price)}</span>
                    {compareAt ? (
                      <span className="text-xs text-muted line-through">{formatPrice(compareAt)}</span>
                    ) : null}
                    {p.featured ? (
                      <span className="ml-auto rounded-full bg-wood-dark px-2 py-1 text-xs font-medium text-background">
                        Vedette
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-muted">Aucun produit ne correspond à ces critères.</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Ouvrir le catalogue complet
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

