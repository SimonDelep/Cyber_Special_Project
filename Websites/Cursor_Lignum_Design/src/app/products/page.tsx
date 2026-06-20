import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type SearchParams = {
  q?: string;
  category?: string;
  featured?: string;
  min?: string;
  max?: string;
  sort?: string;
};

function toNumber(v?: string) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const category = (sp.category ?? "").trim();
  const featured = sp.featured === "1";
  const min = toNumber(sp.min);
  const max = toNumber(sp.max);
  const sort = sp.sort ?? "newest";

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const where = {
    status: "PUBLISHED" as const,
    ...(featured ? { featured: true } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(min !== undefined || max !== undefined
      ? {
          price: {
            ...(min !== undefined ? { gte: min } : {}),
            ...(max !== undefined ? { lte: max } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: 48,
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
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-5xl font-semibold tracking-tight">Catalogue</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Parcourez nos meubles en bois massif. Recherchez, filtrez et trouvez la pièce parfaite.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex self-start rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition-colors hover:bg-border/40 lg:self-auto"
        >
          Retour à l’accueil
        </Link>
      </div>

      <form method="get" className="mt-12 rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-sm font-medium">Recherche</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Table, chaise, noyer..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1 lg:col-span-1">
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
            <span className="text-sm font-medium">Prix min</span>
            <input
              name="min"
              type="number"
              min={0}
              defaultValue={min ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1 lg:col-span-1">
            <span className="text-sm font-medium">Prix max</span>
            <input
              name="max"
              type="number"
              min={0}
              defaultValue={max ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              value="1"
              defaultChecked={featured}
              className="h-4 w-4 rounded border-border"
            />
            <span>Produits en vedette</span>
          </label>

          <div className="flex gap-3">
            <Link
              href="/products"
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

      <div className="mt-10 flex items-center justify-between">
        <p className="text-sm text-muted">
          {products.length} produit{products.length === 1 ? "" : "s"} trouvé
          {products.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="mt-16 rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">Aucun produit ne correspond à ces critères.</p>
        </div>
      ) : null}
    </div>
  );
}

