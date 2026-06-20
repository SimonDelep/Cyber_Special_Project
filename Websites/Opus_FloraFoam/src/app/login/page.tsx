import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in | FloraFoam",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in with your username and password."
      footer={
        <>
          New to FloraFoam?{" "}
          <Link href="/register" className="font-medium text-sage-800 hover:text-sage-900">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-sage-600">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
