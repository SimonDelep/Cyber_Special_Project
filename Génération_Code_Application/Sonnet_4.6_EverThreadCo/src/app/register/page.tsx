import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/profile");
  }

  return <RegisterForm />;
}
