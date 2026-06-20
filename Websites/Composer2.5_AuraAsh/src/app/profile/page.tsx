import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div>
        <h1 className="font-display text-4xl font-medium text-charcoal">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-stone">
          View and manage your account information.
        </p>
      </div>

      <div className="mt-10">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
