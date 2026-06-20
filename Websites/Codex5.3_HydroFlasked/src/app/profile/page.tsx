import { redirect } from "next/navigation";
import { OrderHistory } from "@/components/invoice/OrderHistory";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      invoiceNumber: true,
      totalCents: true,
      createdAt: true,
    },
  });

  const orderSummaries = orders.map((o) => ({
    id: o.id,
    invoiceNumber: o.invoiceNumber,
    totalCents: o.totalCents,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white">My profile</h1>
        <p className="mt-2 text-slate-400">View and manage your account settings.</p>
        <div className="mt-10">
          <ProfileForm user={user} />
        </div>
        <OrderHistory orders={orderSummaries} />
      </div>
    </div>
  );
}
