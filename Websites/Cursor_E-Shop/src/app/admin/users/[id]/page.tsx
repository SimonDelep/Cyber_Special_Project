import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminUserForm } from "@/components/forms/AdminUserForm";
import { updateUserAction } from "@/actions/admin/users";

interface AdminUserEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      balanceCents: true,
    },
  });

  if (!user) {
    notFound();
  }

  const boundAction = updateUserAction.bind(null, user.id);

  return (
    <div className="max-w-lg">
      <Link
        href="/admin/users"
        className="text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Back to users
      </Link>
      <h2 className="mt-4 text-xl font-semibold">Edit user</h2>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <AdminUserForm action={boundAction} defaultValues={user} />
      </div>
    </div>
  );
}
