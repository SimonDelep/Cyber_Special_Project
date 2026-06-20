import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin/AdminPanel";
import type { AdminUser, AdminProduct } from "@/types/admin";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/profile");

  const [users, products] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const initialUsers: AdminUser[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    balance: Number(u.balance),
    firstName: u.firstName,
    lastName: u.lastName,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  const initialProducts: AdminProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    featured: p.featured,
    inStock: p.inStock,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
      <p className="mt-2 text-muted">
        Manage users, products, and monitor system event logs.
      </p>
      <div className="mt-10">
        <AdminPanel
          initialUsers={initialUsers}
          initialProducts={initialProducts}
        />
      </div>
    </div>
  );
}
