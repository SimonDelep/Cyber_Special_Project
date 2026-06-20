"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { parseApiResponse } from "@/lib/parse-api-response";
import { AuthCard } from "./AuthCard";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const password = form.get("password") as string;
      const confirm = form.get("confirmPassword") as string;

      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password,
          displayName: form.get("displayName") || undefined,
          email: form.get("email") || undefined,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Registration failed");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create account" subtitle="Join HydroFlasked">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Username"
          name="username"
          required
          hint="3–32 characters: letters, numbers, underscore"
          autoComplete="username"
        />
        <FormField label="Display name" name="displayName" placeholder="Optional" />
        <FormField label="Email" name="email" type="email" placeholder="Optional" />
        <FormField
          label="Password"
          name="password"
          type="password"
          required
          hint="At least 8 characters"
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-400 hover:text-brand-300">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
