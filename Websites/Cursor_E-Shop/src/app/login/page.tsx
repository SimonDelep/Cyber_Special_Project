import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { AuthForm } from "@/components/forms/AuthForm";
import { loginAction } from "@/actions/auth";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <PageShell narrow>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Access your account or admin panel.
        </p>
        <div className="mt-8">
          <AuthForm
            action={loginAction}
            submitLabel="Sign in"
            pendingLabel="Signing in…"
            hiddenFields={
              callbackUrl ? { callbackUrl } : undefined
            }
          />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300">
            Register
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
