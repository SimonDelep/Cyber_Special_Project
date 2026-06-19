import Link from "next/link";
import { describeError } from "@/lib/errors";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const code = sp?.code ?? "FORBIDDEN";
  const next = sp?.next ?? "/";
  const { title, message } = describeError(code);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-muted">{message}</p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={next}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Continuer
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

