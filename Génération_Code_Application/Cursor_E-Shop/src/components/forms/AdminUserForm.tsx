"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/lib/action-state";
import type { Role } from "@prisma/client";

interface AdminUserFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues: {
    name: string;
    email: string;
    role: Role;
    balanceCents: number;
  };
}

const initialState: ActionState = {};

export function AdminUserForm({ action, defaultValues }: AdminUserFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">User updated successfully.</Alert>
      ) : null}
      <Input
        label="Name"
        name="name"
        defaultValue={defaultValues.name}
        required
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        defaultValue={defaultValues.email}
        required
        error={state.fieldErrors?.email?.[0]}
      />
      <Select
        label="Role"
        name="role"
        defaultValue={defaultValues.role}
        options={[
          { value: "CUSTOMER", label: "Customer" },
          { value: "ADMIN", label: "Admin" },
        ]}
        error={state.fieldErrors?.role?.[0]}
      />
      <Input
        label="Balance (cents)"
        name="balanceCents"
        type="number"
        min={0}
        step={1}
        defaultValue={defaultValues.balanceCents}
        required
        error={state.fieldErrors?.balanceCents?.[0]}
      />
      <p className="text-xs text-zinc-500">
        Balance is stored in cents (e.g. 10000 = $100.00 CAD).
      </p>
      <SubmitButton pendingLabel="Saving…">Save user</SubmitButton>
    </form>
  );
}
