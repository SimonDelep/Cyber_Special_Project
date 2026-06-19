import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Alert } from "@/components/ui/Alert";
import { getCartSummary, lineTotalCents } from "@/lib/cart";
import { cartErrorMessage } from "@/lib/errors";
import { formatBalance } from "@/lib/money";
import { PageShell } from "@/components/layout/PageShell";
import { ProductImage } from "@/components/ui/ProductImage";
import { removeFromCartAction, setCartQuantityAction } from "@/actions/cart";

interface CartPageProps {
  searchParams: Promise<{ added?: string; error?: string; max?: string }>;
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const session = await requireAuth();
  const { added, error, max } = await searchParams;
  const errorMessage = cartErrorMessage(error, max);
  const { items, totalCents, itemCount } = await getCartSummary(session.user.id);

  return (
    <PageShell>
      <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
      {added === "1" ? (
        <div className="mt-4">
          <Alert variant="success">Item added to your cart.</Alert>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-4">
          <Alert>{errorMessage}</Alert>
        </div>
      ) : null}
      <p className="mt-2 text-zinc-400">
        {itemCount === 0
          ? "Your cart is empty."
          : `${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatBalance(totalCents)}`}
      </p>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-500">Add products from the shop to get started.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <ul className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const unitCents = lineTotalCents(item.product.price, 1);
              const lineCents = lineTotalCents(item.product.price, item.quantity);

              return (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:gap-6"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-950 sm:h-28 sm:w-28">
                    {item.product.imageUrl ? (
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-zinc-50">{item.product.name}</h2>
                    <p className="mt-1 text-sm text-cyan-400">
                      {formatBalance(unitCents)} each
                    </p>
                    <form
                      action={setCartQuantityAction}
                      className="mt-3 flex flex-wrap items-center gap-3"
                    >
                      <input type="hidden" name="cartItemId" value={item.id} />
                      <label className="flex items-center gap-2 text-sm text-zinc-400">
                        Qty
                        <input
                          type="number"
                          name="quantity"
                          min={1}
                          max={99}
                          defaultValue={item.quantity}
                          className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                        />
                      </label>
                      <button
                        type="submit"
                        className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        Update
                      </button>
                    </form>
                    <form
                      action={removeFromCartAction.bind(null, item.id)}
                      className="mt-2"
                    >
                      <button
                        type="submit"
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                  <p className="shrink-0 text-right font-semibold text-zinc-100">
                    {formatBalance(lineCents)}
                  </p>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <dt>Subtotal</dt>
                <dd>{formatBalance(totalCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-semibold text-zinc-50">
                <dt>Total</dt>
                <dd>{formatBalance(totalCents)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-zinc-500">
              Paid with your E-Shop store credit balance.
            </p>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-cyan-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
            >
              Proceed to checkout
            </Link>
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm text-zinc-500 hover:text-zinc-300"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
