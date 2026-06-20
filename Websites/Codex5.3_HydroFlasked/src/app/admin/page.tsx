import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { toAdminUsers } from "@/lib/admin/serializers";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user)) redirect("/profile");

  const [users, products] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdminDashboard
          adminUsername={user.username}
          currentAdminId={user.id}
          initialUsers={toAdminUsers(users)}
          initialProducts={products}
        />
      </div>
    </div>
  );
}
