import { createSignal, Show } from 'solid-js';
import type { PublicUser } from '@/types/auth';
import { formatPrice } from '@/lib/utils';

type Props = {
  initialUser: PublicUser;
};

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-4 py-2.5 text-cork-900 placeholder:text-cork-400 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

export default function ProfileForm(props: Props) {
  const [user, setUser] = createSignal(props.initialUser);
  const [username, setUsername] = createSignal(props.initialUser.username);
  const [email, setEmail] = createSignal(props.initialUser.email);
  const [displayName, setDisplayName] = createSignal(props.initialUser.displayName ?? '');
  const [bio, setBio] = createSignal(props.initialUser.bio ?? '');
  const [avatarUrl, setAvatarUrl] = createSignal(props.initialUser.avatarUrl ?? '');
  const [currentPassword, setCurrentPassword] = createSignal('');
  const [newPassword, setNewPassword] = createSignal('');
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  async function handleSave(e: Event) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          username: username(),
          email: email(),
          displayName: displayName(),
          bio: bio(),
          avatarUrl: avatarUrl(),
          currentPassword: currentPassword() || undefined,
          newPassword: newPassword() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setError(data.error ?? 'Update failed.');
        return;
      }

      setUser(data.user);
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Profile updated successfully.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }

      setUser(data.user);
      setAvatarUrl(data.user.avatarUrl ?? '');
      setMessage('Profile picture updated.');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Delete your account permanently? This cannot be undone.',
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error ?? 'Could not delete account.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/';
  }

  const avatarSrc = () => user().avatarUrl || null;

  return (
    <div class="space-y-10">
      <p class="rounded-xl border border-cork-200 bg-cork-100/50 px-4 py-3 text-sm text-cork-700">
        Account balance: <span class="font-semibold text-cork-900">{formatPrice(user().balanceCents)}</span>
      </p>

      <section class="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-cork-300 bg-cork-100">
          <Show
            when={avatarSrc()}
            fallback={
              <span class="flex h-full w-full items-center justify-center font-serif text-2xl text-cork-500">
                {user().username.slice(0, 1).toUpperCase()}
              </span>
            }
          >
            <img
              src={avatarSrc()!}
              alt=""
              class="h-full w-full object-cover"
            />
          </Show>
        </div>
        <div class="flex-1 space-y-3">
          <p class="text-sm text-cork-600">
            Upload an image (max 2 MB) or set a picture URL below.
          </p>
          <label class="inline-flex cursor-pointer items-center rounded-full border border-cork-400 px-4 py-2 text-sm font-medium text-cork-800 hover:bg-cork-100">
            {uploading() ? 'Uploading…' : 'Upload image file'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="sr-only"
              disabled={uploading()}
              onChange={handleAvatarUpload}
            />
          </label>
        </div>
      </section>

      <Show when={message()}>
        <p class="rounded-lg border border-sage-500/30 bg-sage-400/10 px-4 py-3 text-sm text-cork-800">
          {message()}
        </p>
      </Show>
      <Show when={error()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error()}
        </p>
      </Show>

      <form onSubmit={handleSave} class="space-y-5">
        <div>
          <label for="avatarUrl" class="text-sm font-medium text-cork-800">
            Profile picture URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            placeholder="https://example.com/photo.jpg"
            class={inputClass}
            value={avatarUrl()}
            onInput={(e) => setAvatarUrl(e.currentTarget.value)}
          />
          <Show when={errors().avatarUrl}>
            <p class="mt-1 text-sm text-red-700">{errors().avatarUrl}</p>
          </Show>
        </div>

        <div>
          <label for="username" class="text-sm font-medium text-cork-800">
            Username
          </label>
          <input
            id="username"
            required
            class={inputClass}
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
          />
          <Show when={errors().username}>
            <p class="mt-1 text-sm text-red-700">{errors().username}</p>
          </Show>
        </div>

        <div>
          <label for="email" class="text-sm font-medium text-cork-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            class={inputClass}
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
          <Show when={errors().email}>
            <p class="mt-1 text-sm text-red-700">{errors().email}</p>
          </Show>
        </div>

        <div>
          <label for="displayName" class="text-sm font-medium text-cork-800">
            Display name
          </label>
          <input
            id="displayName"
            class={inputClass}
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
          />
        </div>

        <div>
          <label for="bio" class="text-sm font-medium text-cork-800">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            class={inputClass}
            value={bio()}
            onInput={(e) => setBio(e.currentTarget.value)}
          />
          <Show when={errors().bio}>
            <p class="mt-1 text-sm text-red-700">{errors().bio}</p>
          </Show>
        </div>

        <fieldset class="rounded-xl border border-cork-200 p-5 space-y-4">
          <legend class="px-1 text-sm font-medium text-cork-800">
            Change password (optional)
          </legend>
          <div>
            <label for="currentPassword" class="text-sm text-cork-700">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autocomplete="current-password"
              class={inputClass}
              value={currentPassword()}
              onInput={(e) => setCurrentPassword(e.currentTarget.value)}
            />
            <Show when={errors().currentPassword}>
              <p class="mt-1 text-sm text-red-700">{errors().currentPassword}</p>
            </Show>
          </div>
          <div>
            <label for="newPassword" class="text-sm text-cork-700">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autocomplete="new-password"
              class={inputClass}
              value={newPassword()}
              onInput={(e) => setNewPassword(e.currentTarget.value)}
            />
            <Show when={errors().newPassword}>
              <p class="mt-1 text-sm text-red-700">{errors().newPassword}</p>
            </Show>
          </div>
        </fieldset>

        <div class="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving()}
            class="rounded-full bg-cork-800 px-6 py-2.5 text-sm font-medium text-cork-50 hover:bg-cork-700 disabled:opacity-60"
          >
            {saving() ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            class="rounded-full border border-cork-400 px-6 py-2.5 text-sm font-medium text-cork-800 hover:bg-cork-100"
          >
            Log out
          </button>
        </div>
      </form>

      <section class="border-t border-cork-200 pt-8">
        <h2 class="font-serif text-lg text-cork-900">Danger zone</h2>
        <p class="mt-2 text-sm text-cork-600">
          Permanently delete your account and all active sessions.
        </p>
        <button
          type="button"
          disabled={deleting()}
          onClick={handleDelete}
          class="mt-4 rounded-full border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
        >
          {deleting() ? 'Deleting…' : 'Delete my account'}
        </button>
      </section>

      <p class="text-xs text-cork-500">
        Role: <span class="font-medium capitalize">{user().role}</span>
      </p>
    </div>
  );
}
