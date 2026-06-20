import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/profile");
  }

  return (
    <Suspense fallback={<p className="px-6 py-16 text-center">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
