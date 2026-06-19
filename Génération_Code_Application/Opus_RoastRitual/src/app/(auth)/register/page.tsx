import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account | RoastRitual",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-2xl text-espresso">Join RoastRitual</h1>
      <p className="mt-2 text-sm text-espresso/70">
        Create an account with a username and password.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </>
  );
}
