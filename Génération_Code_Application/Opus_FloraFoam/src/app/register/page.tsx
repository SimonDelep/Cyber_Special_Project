import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account | FloraFoam",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Join FloraFoam"
      subtitle="Create a standard user account to manage your profile and shop."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-sage-800 hover:text-sage-900">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
