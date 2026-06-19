import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { formatBalance } from "@/lib/money";
import { PageShell } from "@/components/layout/PageShell";
import { Alert } from "@/components/ui/Alert";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { AvatarForm } from "@/components/forms/AvatarForm";
import { DeleteAccountForm } from "@/components/forms/DeleteAccountForm";
import { updateProfileAction, deleteAccountAction } from "@/actions/account";

export default async function AccountPage() {
  const session = await requireAuth();

  const userResult = await queryDb(() =>
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        balanceCents: true,
        createdAt: true,
      },
    })
  );

  if (userResult.dbError || !userResult.data) {
    return (
      <PageShell>
        <h1 className="text-3xl font-bold tracking-tight">My account</h1>
        <div className="mt-6">
          <Alert>{userResult.dbError ?? "Unable to load your account."}</Alert>
        </div>
      </PageShell>
    );
  }

  const user = userResult.data;

  return (
    <PageShell>
      <h1 className="text-3xl font-bold tracking-tight">My account</h1>
      <p className="mt-2 text-zinc-400">Manage your profile and account settings.</p>

      <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-semibold">Profile picture</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Set your avatar from a link or upload an image file.
        </p>
        <div className="mt-6 max-w-lg">
          <AvatarForm name={user.name} avatarUrl={user.avatarUrl} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Member since {user.createdAt.toLocaleDateString("en-CA")}
          </p>
          <div className="mt-6">
            <ProfileForm
              action={updateProfileAction}
              defaultValues={{ name: user.name, email: user.email }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Balance</h2>
            <Link
              href="/account/orders"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              My orders →
            </Link>
          </div>
          <p className="mt-4 text-3xl font-bold text-cyan-400">
            {formatBalance(user.balanceCents)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Store credit balance (read-only). Contact support to top up.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Role: <span className="text-zinc-300">{user.role}</span>
          </p>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Permanently delete your account and sign out.
        </p>
        <div className="mt-6 max-w-md">
          <DeleteAccountForm action={deleteAccountAction} />
        </div>
      </section>
    </PageShell>
  );
}
