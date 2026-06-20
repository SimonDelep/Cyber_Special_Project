import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
};

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect: redirectTo } = await searchParams;
  const safeRedirect =
    redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/profile";

  const user = await getCurrentUser();
  if (user) redirect(safeRedirect);

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="text-center">
        <h1 className="font-display text-4xl font-medium text-charcoal">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-stone">
          Sign in to manage your AuraAsh profile.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-stone/15 bg-cream p-8">
        <LoginForm redirectTo={safeRedirect} />
      </div>
    </div>
  );
}
