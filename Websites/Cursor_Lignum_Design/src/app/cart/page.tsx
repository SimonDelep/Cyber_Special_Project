import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { clearCartAction, removeFromCartAction, updateCartItemAction } from "./actions";

export default async function CartPage() {
  const cart = getCart();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Votre panier</h1>
        <p className="mt-4 text-muted">Votre panier est vide pour le moment.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Découvrir les produits
        </Link>
      </div>
    );
  }

  const productIds = cart.map((c) => c.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = cart
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product) return null;
      const unit = Number(product.price);
      const quantity = item.quantity;
      const lineTotal = unit * quantity;
      return { product, quantity, lineTotal, unit };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Votre panier</h1>
      <p className="mt-2 text-muted">
        Vérifiez vos articles avant de passer à la simulation de commande.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {lines.map(({ product, quantity, lineTotal, unit }) => {
            const image = product.images?.[0];
            return (
              <div
                key={product.id}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative hidden aspect-square w-28 overflow-hidden rounded-xl border border-border bg-border/40 sm:block"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {formatPrice(unit)} · Qté {quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-sm font-semibold">{formatPrice(lineTotal)}</p>
                    <form action={updateCartItemAction} className="flex items-center gap-2 text-sm">
                      <input type="hidden" name="productId" value={product.id} />
                      <label className="flex items-center gap-1">
                        <span className="text-xs text-muted">Qté</span>
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          max={99}
                          defaultValue={quantity}
                          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-border/40"
                      >
                        Mettre à jour
                      </button>
                    </form>

                    <form action={removeFromCartAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-muted underline underline-offset-4"
                      >
                        Retirer
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}

          <form action={clearCartAction}>
            <button
              type="submit"
              className="text-sm font-medium text-muted underline underline-offset-4"
            >
              Vider le panier
            </button>
          </form>
        </div>

        <aside className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-serif text-2xl font-semibold">Résumé</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Livraison</dt>
              <dd className="font-medium">
                {shipping === 0 ? "Offerte (simulation)" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
              <dt className="font-semibold">Total simulé</dt>
              <dd className="font-semibold">{formatPrice(total)}</dd>
            </div>
          </dl>

          <p className="text-xs text-muted">
            Cette étape simule un passage de commande : aucun paiement réel n’est effectué, mais une
            commande de test sera enregistrée dans la base de données.
          </p>

          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Procéder à la simulation de commande
          </Link>

          <Link
            href="/products"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-border/40"
          >
            Continuer vos achats
          </Link>
        </aside>
      </div>
    </div>
  );
}

