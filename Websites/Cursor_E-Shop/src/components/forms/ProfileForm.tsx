"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/lib/action-state";

interface ProfileFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues: { name: string; email: string };
}

const initialState: ActionState = {};

export function ProfileForm({ action, defaultValues }: ProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">Profile updated successfully.</Alert>
      ) : null}
      <Input
        label="Name"
        name="name"
        type="text"
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
      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
