import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { UserEditForm } from "@/components/admin/UserEditForm";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true },
  });
  return {
    title: user ? `Edit @${user.username} | Admin` : "User not found | Admin",
  };
}

export default async function AdminUserEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      profileImageUrl: true,
      role: true,
      balanceCents: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isSelf = session?.user?.id === user.id;

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        ← All users
      </Link>

      <div className="mt-6">
        <UserEditForm
          user={{
            ...user,
            createdAt: user.createdAt.toISOString(),
          }}
          isSelf={isSelf}
        />
      </div>
    </div>
  );
}
