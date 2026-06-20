"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField, FormMessage } from "@/components/ui/FormField";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/profile";
  const registered = searchParams.get("registered") === "1";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {registered && (
        <FormMessage type="success" message="Account created. Sign in with your credentials." />
      )}
      {error && <FormMessage type="error" message={error} />}
      <FormField label="Username" name="username" autoComplete="username" required />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-sage-700 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-sage-900 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-sage-600">
        No account?{" "}
        <Link href="/register" className="font-medium text-sage-800 hover:text-sage-900">
          Create one
        </Link>
      </p>
    </form>
  );
}
