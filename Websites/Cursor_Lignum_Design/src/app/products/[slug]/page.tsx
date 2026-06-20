import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/auth";
import { createReviewAction } from "./actions";
import { addToCartAction } from "./cart-actions";

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewError?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAt: true,
      images: true,
      material: true,
      dimensions: true,
      weight: true,
      category: { select: { name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          imageUrl: true,
          createdAt: true,
          user: { select: { username: true } },
        },
      },
    },
  });

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-semibold">Produit introuvable</h1>
        <Link href="/products" className="mt-6 inline-block underline underline-offset-4">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const session = await auth();
  const ratings = product.reviews.map((r) => r.rating);
  const average = avg(ratings);

  const heroImage = product.images?.[0];
  const price = Number(product.price);
  const compareAt = product.compareAt ? Number(product.compareAt) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition-colors hover:bg-border/40"
        >
          ← Catalogue
        </Link>
        <p className="text-sm text-muted">{product.category.name}</p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-border/30">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : null}
        </div>

        <div>
          <h1 className="font-serif text-5xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-4 text-muted">{product.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-lg font-semibold">{formatPrice(price)}</span>
            {compareAt ? (
              <span className="text-sm text-muted line-through">{formatPrice(compareAt)}</span>
            ) : null}
          </div>

          <form action={addToCartAction} className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-4">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="slug" value={product.slug} />
            <label className="space-y-1 text-sm">
              <span className="font-medium">Quantité</span>
              <input
                name="quantity"
                type="number"
                min={1}
                max={99}
                defaultValue={1}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Ajouter au panier
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl font-semibold">Détails</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {product.material ? (
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Matériau</dt>
                  <dd className="font-medium">{product.material}</dd>
                </div>
              ) : null}
              {product.dimensions ? (
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Dimensions</dt>
                  <dd className="font-medium">{product.dimensions}</dd>
                </div>
              ) : null}
              {product.weight ? (
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Poids</dt>
                  <dd className="font-medium">{product.weight}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Avis</dt>
                <dd className="font-medium">
                  {product.reviews.length} · {average.toFixed(1)}/5
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-16 border-t border-border pt-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight">Avis</h2>
            <p className="mt-2 text-muted">
              {product.reviews.length === 0
                ? "Aucun avis pour le moment."
                : "Les avis de la communauté Lignum Design."}
            </p>
          </div>
          {!session?.user?.id ? (
            <Link
              href={`/login?next=/products/${product.slug}`}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Se connecter pour laisser un avis
            </Link>
          ) : null}
        </div>

        {session?.user?.id ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
            <h3 className="font-serif text-2xl font-semibold">Ajouter / mettre à jour mon avis</h3>

            {sp.reviewError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Impossible d’enregistrer votre avis. Vérifiez les champs (note 1–5, texte ≥ 10
                caractères) et l’image.
              </div>
            ) : null}

            <form action={createReviewAction} className="mt-6 space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="slug" value={product.slug} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Note</span>
                  <select
                    name="rating"
                    defaultValue="5"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Très bien</option>
                    <option value="3">3 - Bien</option>
                    <option value="2">2 - Moyen</option>
                    <option value="1">1 - Décevant</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">Titre (optionnel)</span>
                  <input
                    name="title"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    placeholder="Magnifique finition…"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-sm font-medium">Votre avis</span>
                <textarea
                  name="body"
                  required
                  minLength={10}
                  className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Décrivez la qualité, le confort, la livraison, etc."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Image (lien, optionnel)</span>
                  <input
                    name="imageUrl"
                    type="url"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">Image (upload local, optionnel)</span>
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Publier mon avis
              </button>
              <p className="text-xs text-muted">
                Si vous fournissez un lien et un upload, le lien sera utilisé en priorité.
              </p>
            </form>
          </div>
        ) : null}

        <div className="mt-10 space-y-6">
          {product.reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-surface p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.user.username}</p>
                  <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("fr-CA")}</p>
                </div>
                <p className="text-sm font-semibold">{r.rating}/5</p>
              </div>
              {r.title ? <h3 className="mt-4 font-serif text-2xl font-semibold">{r.title}</h3> : null}
              <p className="mt-3 whitespace-pre-wrap text-muted">{r.body}</p>
              {r.imageUrl ? (
                <div className="mt-6 overflow-hidden rounded-xl border border-border">
                  <Image
                    src={r.imageUrl}
                    alt="Image avis"
                    width={1200}
                    height={800}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

