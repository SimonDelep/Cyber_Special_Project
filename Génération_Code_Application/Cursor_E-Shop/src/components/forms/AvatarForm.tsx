"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/account/UserAvatar";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/lib/action-state";
import {
  updateAvatarFromFileAction,
  updateAvatarFromUrlAction,
} from "@/actions/profile";

interface AvatarFormProps {
  name: string;
  avatarUrl: string | null;
}

const initialState: ActionState = {};

type Tab = "url" | "upload";

export function AvatarForm({ name, avatarUrl }: AvatarFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [urlState, urlAction] = useActionState(
    updateAvatarFromUrlAction,
    initialState
  );
  const [fileState, fileAction] = useActionState(
    updateAvatarFromFileAction,
    initialState
  );

  const activeState = tab === "url" ? urlState : fileState;

  useEffect(() => {
    if (urlState.success || fileState.success) {
      router.refresh();
    }
  }, [urlState.success, fileState.success, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={name} avatarUrl={avatarUrl} size="lg" />
        <p className="text-sm text-zinc-500">
          Use a public image URL or upload a file from your device (max 2 MB).
        </p>
      </div>

      <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "url"
              ? "bg-cyan-500/20 text-cyan-300"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Image URL
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "upload"
              ? "bg-cyan-500/20 text-cyan-300"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Upload file
        </button>
      </div>

      {activeState.error ? <Alert>{activeState.error}</Alert> : null}
      {activeState.success ? (
        <Alert variant="success">
          {activeState.message ?? "Profile picture updated."}
        </Alert>
      ) : null}

      {tab === "url" ? (
        <form action={urlAction} className="space-y-4">
          <Input
            label="Image URL"
            name="avatarUrl"
            type="url"
            placeholder="https://example.com/photo.jpg"
            defaultValue={
              avatarUrl?.startsWith("http") ? avatarUrl : ""
            }
            required
            error={urlState.fieldErrors?.avatarUrl?.[0]}
          />
          <SubmitButton pendingLabel="Saving…">Set from URL</SubmitButton>
        </form>
      ) : (
        <form action={fileAction} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="avatarFile"
              className="block text-sm font-medium text-zinc-300"
            >
              Image file
            </label>
            <input
              id="avatarFile"
              name="avatarFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:file:bg-cyan-400"
            />
            <p className="text-xs text-zinc-500">
              JPEG, PNG, WebP, or GIF — maximum 2 MB.
            </p>
            {fileState.fieldErrors?.avatarFile?.[0] ? (
              <p className="text-sm text-red-400">
                {fileState.fieldErrors.avatarFile[0]}
              </p>
            ) : null}
          </div>
          <SubmitButton pendingLabel="Uploading…">Upload picture</SubmitButton>
        </form>
      )}
    </div>
  );
}
