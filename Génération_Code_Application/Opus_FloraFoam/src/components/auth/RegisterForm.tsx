"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField, FormMessage } from "@/components/ui/FormField";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      username: formData.get("username"),
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <FormMessage type="error" message={error} />}
      <FormField
        label="Username"
        name="username"
        autoComplete="username"
        required
        hint="3–20 characters: lowercase letters, numbers, underscore."
        pattern="[a-z0-9_]{3,20}"
      />
      <FormField label="Display name" name="name" autoComplete="name" />
      <FormField label="Email (optional)" name="email" type="email" autoComplete="email" />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <FormField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-sage-700 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-sage-900 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-sage-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sage-800 hover:text-sage-900">
          Sign in
        </Link>
      </p>
    </form>
  );
}
