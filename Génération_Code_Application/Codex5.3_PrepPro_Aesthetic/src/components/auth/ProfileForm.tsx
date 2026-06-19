import { createSignal, Show } from "solid-js";
import type { PublicUser } from "@/lib/auth/types";
import { formatPrice } from "@/lib/format";

type Props = {
  user: PublicUser;
  forbidden?: boolean;
};

function AvatarPreview(props: { url: string | null; name: string }) {
  return (
    <Show
      when={props.url}
      fallback={
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
          {props.name.charAt(0).toUpperCase()}
        </div>
      }
    >
      <img
        src={props.url!}
        alt=""
        class="h-24 w-24 rounded-full border-2 border-brand-200 object-cover"
        width={96}
        height={96}
      />
    </Show>
  );
}

export default function ProfileForm(props: Props) {
  const [user, setUser] = createSignal(props.user);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal(props.forbidden ? "You do not have permission to access the admin area." : "");
  const [loading, setLoading] = createSignal(false);
  const [deleteOpen, setDeleteOpen] = createSignal(false);

  async function handleProfileSubmit(e: Event) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const payload: Record<string, string> = {
      displayName: String(data.get("displayName") ?? ""),
      email: String(data.get("email") ?? ""),
      bio: String(data.get("bio") ?? ""),
      avatarUrl: String(data.get("avatarUrl") ?? ""),
    };

    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    if (currentPassword || newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Update failed.");
        return;
      }
      setUser(json.user);
      setMessage("Profile updated successfully.");
      form.querySelector<HTMLInputElement>('[name="currentPassword"]')!.value = "";
      form.querySelector<HTMLInputElement>('[name="newPassword"]')!.value = "";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e: Event) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      setUser(json.user);
      setMessage("Profile picture updated.");
      form.reset();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: Event) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.get("password"),
          confirmUsername: data.get("confirmUsername"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not delete account.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="mx-auto max-w-2xl space-y-8">
      <Show when={error()}>
        <p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error()}
        </p>
      </Show>
      <Show when={message()}>
        <p class="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
          {message()}
        </p>
      </Show>

      <section class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-center gap-6">
          <AvatarPreview url={user().avatarUrl} name={user().displayName} />
          <div>
            <h1 class="font-display text-2xl font-semibold text-ink">
              {user().displayName}
            </h1>
            <p class="text-muted">@{user().username}</p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span class="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-800">
                {user().role}
              </span>
              <span class="text-sm text-muted">
                Balance:{" "}
                <strong class="text-brand-800">
                  {formatPrice(user().balanceCents)}
                </strong>
              </span>
            </div>
            <Show when={user().role === "admin"}>
              <a
                href="/admin"
                class="ml-2 text-sm font-medium text-brand-700 hover:underline"
              >
                Admin dashboard →
              </a>
            </Show>
          </div>
        </div>
        <form method="post" action="/api/auth/logout" class="mt-4 inline">
          <button
            type="submit"
            class="text-sm font-medium text-muted hover:text-brand-700"
          >
            Sign out
          </button>
        </form>
      </section>

      <section class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-ink">Profile picture</h2>
        <p class="mt-1 text-sm text-muted">
          Set an image URL below or upload a file (JPEG, PNG, WebP, GIF — max 2 MB).
        </p>

        <form class="mt-4" onSubmit={handleAvatarUpload}>
          <label class="block text-sm font-medium text-ink" for="avatar-file">
            Upload file
          </label>
          <input
            id="avatar-file"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-800"
          />
          <button
            type="submit"
            disabled={loading()}
            class="mt-3 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-60"
          >
            Upload picture
          </button>
        </form>
      </section>

      <section class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-ink">Profile details</h2>
        <form class="mt-4 space-y-4" onSubmit={handleProfileSubmit}>
          <div>
            <label class="block text-sm font-medium text-muted">Username</label>
            <input
              type="text"
              value={user().username}
              disabled
              class="mt-1 w-full rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-muted"
            />
            <p class="mt-1 text-xs text-muted">Username cannot be changed.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-ink" for="displayName">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={user().displayName}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink" for="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={user().email}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink" for="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxlength={500}
              value={user().bio}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink" for="avatarUrl">
              Profile picture URL
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={user().avatarUrl ?? ""}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <p class="mt-1 text-xs text-muted">Leave empty to remove URL-based avatar.</p>
          </div>

          <div class="border-t border-brand-100 pt-4">
            <h3 class="text-sm font-semibold text-ink">Change password</h3>
            <p class="text-xs text-muted">Leave blank to keep your current password.</p>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-ink" for="currentPassword">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autocomplete="current-password"
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-ink" for="newPassword">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  autocomplete="new-password"
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading()}
            class="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            Save changes
          </button>
        </form>
      </section>

      <section class="rounded-2xl border border-red-200 bg-red-50/30 p-6">
        <h2 class="text-lg font-semibold text-red-900">Delete account</h2>
        <p class="mt-1 text-sm text-red-800/80">
          This permanently removes your profile and sessions. This cannot be undone.
        </p>
        <Show
          when={deleteOpen()}
          fallback={
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              class="mt-4 text-sm font-semibold text-red-700 hover:underline"
            >
              Delete my account
            </button>
          }
        >
          <form class="mt-4 space-y-3" onSubmit={handleDelete}>
            <div>
              <label class="block text-sm font-medium text-red-900" for="confirmUsername">
                Type your username to confirm: <strong>{user().username}</strong>
              </label>
              <input
                id="confirmUsername"
                name="confirmUsername"
                type="text"
                required
                class="mt-1 w-full rounded-lg border border-red-200 px-3 py-2 text-ink outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-red-900" for="delete-password">
                Password
              </label>
              <input
                id="delete-password"
                name="password"
                type="password"
                required
                class="mt-1 w-full rounded-lg border border-red-200 px-3 py-2 text-ink outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div class="flex gap-3">
              <button
                type="submit"
                disabled={loading()}
                class="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Permanently delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                class="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>
      </section>
    </div>
  );
}
