"use client";

import { useActionState } from "react";
import { placeOrderAction } from "@/actions/checkout";
import type { ActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface PlaceOrderFormProps {
  canAfford: boolean;
}

const initialState: ActionState = {};

export function PlaceOrderForm({ canAfford }: PlaceOrderFormProps) {
  const [state, formAction] = useActionState(placeOrderAction, initialState);

  return (
    <form action={formAction} className="mt-6">
      {state.error ? <Alert>{state.error}</Alert> : null}
      <div className={state.error ? "mt-4" : ""}>
        <SubmitButton
          pendingLabel="Placing order…"
          disabled={!canAfford}
          className="w-full"
        >
          Place order
        </SubmitButton>
      </div>
    </form>
  );
}
