import { OrderHistory } from "@/components/profile/OrderHistory";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/format";

type ProfilePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = {
  title: "My profile | RoastRitual",
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const sessionUser = await requireAuth();
  const params = await searchParams;

  const [user, orders] = await Promise.all([
    db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        role: true,
        balanceCents: true,
      },
    }),
    db.order.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, totalCents: true, createdAt: true },
    }),
  ]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-espresso">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-espresso">My profile</h1>
      <p className="mt-2 text-sm text-espresso/70">
        View and update your personal information.
      </p>
      <p className="mt-4 rounded-2xl border border-sage/25 bg-linen px-4 py-3 text-sm text-espresso">
        Account balance:{" "}
        <span className="font-semibold">{formatCents(user.balanceCents)}</span>
        <span className="text-espresso/60">
          {" "}
          — used for cart checkout on the{" "}
          <a href="/cart" className="text-sage-dark underline">
            cart page
          </a>
          .
        </span>
      </p>
      <div className="mt-10 rounded-3xl border border-sage/25 bg-cream/60 p-8">
        <ProfileForm
          user={user}
          unauthorized={params.error === "unauthorized"}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-espresso">Purchase history</h2>
        <p className="mt-1 text-sm text-espresso/70">
          Download PDF invoices for past orders.
        </p>
        <div className="mt-4">
          <OrderHistory orders={orders} />
        </div>
      </section>
    </div>
  );
}
