"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Erreur</h1>
      <p className="mt-4 text-muted">
        Une erreur inattendue s’est produite. Vous pouvez réessayer ou revenir à l’accueil.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-medium">Détails</p>
        <p className="mt-2 text-sm text-muted break-words">
          {error.message || "Erreur inconnue"}
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted">
            Digest: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={() => reset()}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-border/40"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}

