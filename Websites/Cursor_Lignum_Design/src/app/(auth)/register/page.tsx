import Link from "next/link";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="mt-2 text-sm text-muted">Rejoignez Lignum Design en quelques secondes.</p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "exists"
            ? "Cet email ou nom d’utilisateur est déjà utilisé."
            : "Inscription impossible. Vérifiez les champs."}
        </div>
      ) : null}

      <form action={registerAction} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Prénom</label>
            <input
              name="firstName"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nom</label>
            <input
              name="lastName"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nom d’utilisateur</label>
          <input
            name="username"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="username"
            placeholder="lignum_fan"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="email"
            placeholder="vous@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="new-password"
            placeholder="Minimum 8 caractères"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

