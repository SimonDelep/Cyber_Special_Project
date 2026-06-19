import Link from "next/link";
import { auth } from "@/auth";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { simulateCheckoutAction } from "./actions";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const [session, sp] = await Promise.all([auth(), searchParams]);

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Passer la commande</h1>
        <p className="mt-4 text-muted">
          Vous devez être connecté pour simuler une commande. Cela nous permet d’associer la
          commande à votre profil.
        </p>
        <Link
          href="/login?next=/checkout"
          className="mt-8 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const cart = getCart();
  if (!cart.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Passer la commande</h1>
        <p className="mt-4 text-muted">Votre panier est vide.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Découvrir les produits
        </Link>
      </div>
    );
  }

  const errorParam = (await sp)?.error;
  const error =
    errorParam === "1"
      ? "VALIDATION"
      : errorParam === "INSUFFICIENT_FUNDS"
        ? "INSUFFICIENT_FUNDS"
        : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">
        Simulation de commande
      </h1>
      <p className="mt-3 text-muted">
        Remplissez les informations ci-dessous. Aucune transaction réelle ne sera effectuée, mais
        une commande de test sera enregistrée.
      </p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "INSUFFICIENT_FUNDS"
            ? "Fonds insuffisants : votre balance ne permet pas de finaliser cet achat."
            : "Certains champs sont invalides. Vérifiez vos informations et réessayez."}
        </div>
      ) : null}

      <form action={simulateCheckoutAction} className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Prénom</span>
            <input
              name="firstName"
              defaultValue={session.user.name?.split(" ")[0] ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Nom</span>
            <input
              name="lastName"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              required
            />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Adresse courriel</span>
          <input
            name="email"
            type="email"
            defaultValue={session.user.email ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Téléphone (optionnel)</span>
          <input
            name="phone"
            type="tel"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Adresse de livraison (simulation)</span>
          <textarea
            name="shippingAddress"
            className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder="Numéro, rue, ville, code postal…"
            required
          />
        </label>

        <p className="text-xs text-muted">
          Aucun paiement réel n’est traité. Cette étape sert uniquement à tester le flux de
          commande.
        </p>

        <button
          type="submit"
          className="mt-2 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Confirmer la simulation
        </button>
      </form>
    </div>
  );
}

