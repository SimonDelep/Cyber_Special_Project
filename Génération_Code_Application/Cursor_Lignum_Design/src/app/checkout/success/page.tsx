import Link from "next/link";
import { Download } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp?.order;

  const invoiceHref = orderNumber
    ? `/api/invoice/${encodeURIComponent(orderNumber)}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Commande simulée ✨</h1>
      <p className="mt-4 text-muted">
        Merci ! Votre commande de test a été enregistrée dans la base de données. Aucune transaction
        réelle n’a été effectuée.
      </p>

      {orderNumber ? (
        <p className="mt-4 text-sm font-medium">
          Numéro de commande simulée : <span className="font-mono">{orderNumber}</span>
        </p>
      ) : null}

      {invoiceHref ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-serif text-xl font-semibold">Facture</h2>
          <p className="mt-2 text-sm text-muted">
            Téléchargez votre facture au format PDF pour vos archives.
          </p>
          <a
            href={invoiceHref}
            download
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Télécharger la facture (PDF)
          </a>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/products"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Continuer vos achats
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-border/40"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
