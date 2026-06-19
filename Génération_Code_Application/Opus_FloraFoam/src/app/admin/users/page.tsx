import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/types/product";

export const metadata = {
  title: "Admin — Users | FloraFoam",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      balanceCents: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-sage-900">Users</h2>
          <p className="text-sm text-sage-600">{users.length} registered accounts</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sage-200/80">
        <table className="min-w-full divide-y divide-sage-200 text-sm">
          <thead className="bg-sage-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Username</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Name</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Role</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Balance</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-sage-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100 bg-cream-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/60">
                <td className="px-4 py-3 font-medium text-sage-900">@{user.username}</td>
                <td className="px-4 py-3 text-sage-700">{user.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-sage-200 text-sage-900"
                        : "bg-sage-100 text-sage-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sage-700">{formatPrice(user.balanceCents)}</td>
                <td className="px-4 py-3 text-sage-600">
                  {user.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="font-medium text-sage-800 hover:text-sage-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
