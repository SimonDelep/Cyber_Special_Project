import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return (
      <p className="px-6 py-16 text-center text-sand-600">
        Account not found.
      </p>
    );
  }

  return <ProfileForm user={user} />;
}
