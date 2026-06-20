import type { Metadata } from "next";
import { UsersManager } from "@/components/admin/UsersManager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage users",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      balanceCents: true,
      createdAt: true,
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersManager users={serialized} />;
}
