import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/auth/ProfileForm";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      bio: true,
      profilePicture: true,
      createdAt: true,
    },
  });

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">My profile</h1>
      <p className="mt-2 text-muted">
        View and update your account information.
      </p>
      <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
        <ProfileForm
          profile={{
            ...profile,
            createdAt: profile.createdAt.toISOString(),
          }}
        />
      </div>
    </div>
  );
}
