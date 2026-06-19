import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForms } from "@/components/profile/ProfileForms";
import { OrderHistory } from "@/components/profile/OrderHistory";
import { logoutAction } from "@/app/profile/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/types/product";

export const metadata = {
  title: "My profile | FloraFoam",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
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
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        invoiceNumber: true,
        totalCents: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-sage-900">My profile</h1>
          <p className="mt-2 text-sage-600">View and manage your account information.</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-sage-600">
        <p>
          Account balance:{" "}
          <span className="font-medium text-sage-900">{formatPrice(user.balanceCents)}</span>
        </p>
        <Link href="/cart" className="font-medium text-sage-800 hover:text-sage-900">
          View cart →
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className="font-medium text-sage-800 hover:text-sage-900">
            Admin dashboard →
          </Link>
        )}
      </div>

      <ProfileForms
        user={{
          ...user,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        }}
      />

      <OrderHistory
        orders={orders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
