"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/lib/action-state";

interface DeleteAccountFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function DeleteAccountForm({ action }: DeleteAccountFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      <p className="text-sm text-zinc-400">
        This permanently deletes your account. Type{" "}
        <span className="font-mono text-red-300">DELETE</span> to confirm.
      </p>
      <Input
        label="Confirmation"
        name="confirm"
        type="text"
        placeholder="DELETE"
        required
        autoComplete="off"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
      >
        Delete my account
      </button>
    </form>
  );
}
