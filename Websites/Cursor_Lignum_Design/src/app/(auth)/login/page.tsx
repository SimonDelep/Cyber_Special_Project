"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { describeError } from "@/lib/errors";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Connexion</h1>
      <p className="mt-2 text-sm text-muted">Accédez à votre profil et vos commandes.</p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(() => {
            if (error === "CredentialsSignin") return describeError("WRONG_CREDENTIALS").message;
            if (error === "UNAUTHORIZED") return describeError("UNAUTHORIZED").message;
            return "Connexion impossible. Vérifiez vos identifiants.";
          })()}
        </div>
      ) : null}
      {message ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage(null);

          const res = await signIn("credentials", {
            identifier,
            password,
            redirect: false,
          });

          setLoading(false);

          if (!res || res.error) {
            setMessage("Email/nom d’utilisateur ou mot de passe incorrect.");
            return;
          }

          router.push(next);
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">Email ou nom d’utilisateur</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mot de passe</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Pas de compte ?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Chargement...</div>}>
      <LoginInner />
    </Suspense>
  );
}

