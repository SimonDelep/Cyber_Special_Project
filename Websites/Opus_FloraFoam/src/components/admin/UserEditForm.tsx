"use client";

import { useActionState } from "react";
import {
  adjustBalanceAction,
  setBalanceAction,
  updateUserAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatPrice } from "@/types/product";
import { centsToDollarsString } from "@/lib/validations/admin";
import type { Role } from "@prisma/client";

type AdminUser = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  profileImageUrl: string | null;
  role: Role;
  balanceCents: number;
  createdAt: string;
};

const initialState: AdminActionState = {};

function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-sage-900">{title}</h2>
      <p className="mt-1 text-sm text-sage-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function UserEditForm({
  user,
  isSelf,
}: {
  user: AdminUser;
  isSelf: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateUserAction,
    initialState,
  );
  const [setBalanceState, setBalanceFormAction, setBalancePending] = useActionState(
    setBalanceAction,
    initialState,
  );
  const [adjustState, adjustAction, adjustPending] = useActionState(
    adjustBalanceAction,
    initialState,
  );

  const displayName = user.name ?? user.username;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserAvatar name={displayName} imageUrl={user.profileImageUrl} size="lg" />
        <div>
          <p className="font-display text-2xl font-semibold text-sage-900">@{user.username}</p>
          <p className="text-sm text-sage-600">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-sm font-medium text-sage-800">
            Balance: {formatPrice(user.balanceCents)}
          </p>
        </div>
      </div>

      <AdminSection title="Profile & role" description="Update account details and permissions.">
        <form action={profileAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          {profileState.error && <FormMessage type="error" message={profileState.error} />}
          {profileState.success && (
            <FormMessage type="success" message="User updated successfully." />
          )}

          <FormField
            label="Display name"
            name="name"
            defaultValue={user.name ?? ""}
            error={profileState.fieldErrors?.name?.[0]}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            error={profileState.fieldErrors?.email?.[0]}
          />
          <FormField
            label="Profile image URL"
            name="profileImageUrl"
            type="url"
            defaultValue={user.profileImageUrl ?? ""}
            hint="https://… or leave empty"
            error={profileState.fieldErrors?.profileImageUrl?.[0]}
          />
          <FormField label="Role" name="role" error={profileState.fieldErrors?.role?.[0]}>
            <select
              id="role"
              name="role"
              defaultValue={user.role}
              disabled={isSelf}
              className="w-full rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 disabled:opacity-60"
            >
              <option value="USER">Standard user</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </FormField>
          {isSelf && (
            <p className="text-xs text-sage-500">You cannot change your own role.</p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:opacity-60"
          >
            {profilePending ? "Saving…" : "Save user"}
          </button>
        </form>
      </AdminSection>

      <AdminSection
        title="Account balance"
        description="Set an exact balance or apply a positive or negative adjustment."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <form action={setBalanceFormAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-sm font-medium text-sage-800">Set exact balance (CAD)</p>
            {setBalanceState.error && (
              <FormMessage type="error" message={setBalanceState.error} />
            )}
            {setBalanceState.success && (
              <FormMessage type="success" message="Balance updated." />
            )}
            <FormField
              label="New balance ($)"
              name="balanceDollars"
              type="number"
              step="0.01"
              min="0"
              defaultValue={centsToDollarsString(user.balanceCents)}
              error={setBalanceState.fieldErrors?.balanceDollars?.[0]}
            />
            <button
              type="submit"
              disabled={setBalancePending}
              className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50 disabled:opacity-60"
            >
              {setBalancePending ? "Updating…" : "Set balance"}
            </button>
          </form>

          <form action={adjustAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-sm font-medium text-sage-800">Adjust balance (CAD)</p>
            {adjustState.error && <FormMessage type="error" message={adjustState.error} />}
            {adjustState.success && (
              <FormMessage type="success" message="Adjustment applied." />
            )}
            <FormField
              label="Amount to add or subtract ($)"
              name="adjustmentDollars"
              type="number"
              step="0.01"
              placeholder="e.g. 10 or -5"
              hint="Use negative values to deduct."
              error={adjustState.fieldErrors?.adjustmentDollars?.[0]}
            />
            <button
              type="submit"
              disabled={adjustPending}
              className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50 disabled:opacity-60"
            >
              {adjustPending ? "Applying…" : "Apply adjustment"}
            </button>
          </form>
        </div>
      </AdminSection>
    </div>
  );
}
