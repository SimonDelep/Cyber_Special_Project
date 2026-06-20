import { createSignal, Show } from 'solid-js';
import type { PublicUser } from '@/lib/auth/types';

interface Props {
  user: PublicUser;
}

export default function ProfileForm(props: Props) {
  const [user, setUser] = createSignal(props.user);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [deleteConfirm, setDeleteConfirm] = createSignal(false);

  const avatarSrc = () =>
    user().profilePicture ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user().displayName)}&background=339dff&color=fff`;

  const handleProfileSubmit = async (event: Event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    const payload: Record<string, string | null> = {
      displayName: String(data.get('displayName') ?? ''),
      email: String(data.get('email') ?? ''),
      bio: String(data.get('bio') ?? ''),
    };

    const pictureUrl = String(data.get('profilePictureUrl') ?? '').trim();
    payload.profilePicture = pictureUrl || null;

    const currentPassword = String(data.get('currentPassword') ?? '');
    const newPassword = String(data.get('newPassword') ?? '');
    if (newPassword) {
      (payload as Record<string, string>).currentPassword = currentPassword;
      (payload as Record<string, string>).newPassword = newPassword;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Update failed.');
        return;
      }
      setUser(json.user);
      setMessage('Profile updated successfully.');
      form.querySelector<HTMLInputElement>('[name="currentPassword"]')!.value = '';
      form.querySelector<HTMLInputElement>('[name="newPassword"]')!.value = '';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Upload failed.');
        return;
      }
      setUser(json.user);
      setMessage('Profile picture uploaded.');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      input.value = '';
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleDelete = async (event: Event) => {
    event.preventDefault();
    if (!deleteConfirm()) {
      setDeleteConfirm(true);
      setError('Click delete again to confirm account removal.');
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const password = String(data.get('deletePassword') ?? '');

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not delete account.');
        setDeleteConfirm(false);
        return;
      }
      window.location.href = '/?deleted=1';
    } catch {
      setError('Network error. Please try again.');
      setDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-8">
      <Show when={message()}>
        <p class="rounded-lg border border-stream-500/30 bg-stream-500/10 px-4 py-3 text-sm text-stream-300" role="status">
          {message()}
        </p>
      </Show>
      <Show when={error()}>
        <p class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {error()}
        </p>
      </Show>

      <section class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <img
          src={avatarSrc()}
          alt={`${user().displayName}'s profile`}
          class="h-24 w-24 rounded-full border-2 border-volt-500/50 object-cover bg-slate-800"
          width={96}
          height={96}
        />
        <div class="flex-1 space-y-3">
          <p class="text-sm text-slate-400">
            Role: <span class="font-medium text-volt-300 capitalize">{user().role}</span>
            {' · '}
            @{user().username}
          </p>
          <p class="text-sm text-slate-400">
            Account balance:{' '}
            <span class="font-mono font-medium text-stream-400">
              ${user().balance.toFixed(2)}
            </span>
          </p>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-slate-300">Upload image file</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={loading()}
              onChange={handleAvatarUpload}
              class="block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-volt-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-volt-500"
            />
          </label>
        </div>
      </section>

      <form onSubmit={handleProfileSubmit} class="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h2 class="text-lg font-semibold text-white">Profile details</h2>

        <div>
          <label for="displayName" class="mb-1.5 block text-sm font-medium text-slate-300">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={user().displayName}
            class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          />
        </div>

        <div>
          <label for="email" class="mb-1.5 block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={user().email}
            class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          />
        </div>

        <div>
          <label for="bio" class="mb-1.5 block text-sm font-medium text-slate-300">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxlength={500}
            value={user().bio}
            class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          />
        </div>

        <div>
          <label for="profilePictureUrl" class="mb-1.5 block text-sm font-medium text-slate-300">
            Profile picture URL
          </label>
          <input
            id="profilePictureUrl"
            name="profilePictureUrl"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={user().profilePicture?.startsWith('http') ? user().profilePicture! : ''}
            class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          />
          <p class="mt-1 text-xs text-slate-500">Or upload a file above. URL saves when you click Save profile.</p>
        </div>

        <div class="border-t border-white/10 pt-5">
          <h3 class="mb-4 text-sm font-semibold text-slate-200">Change password</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="currentPassword" class="mb-1.5 block text-sm font-medium text-slate-300">
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autocomplete="current-password"
                class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
              />
            </div>
            <div>
              <label for="newPassword" class="mb-1.5 block text-sm font-medium text-slate-300">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
                autocomplete="new-password"
                class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading()}
          class="rounded-full bg-volt-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-volt-500 disabled:opacity-60 transition-colors"
        >
          {loading() ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleLogout}
          class="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors"
        >
          Log out
        </button>
      </div>

      <form
        onSubmit={handleDelete}
        class="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 space-y-4"
      >
        <h2 class="text-lg font-semibold text-red-200">Danger zone</h2>
        <p class="text-sm text-slate-400">
          Permanently delete your account and all sessions. This cannot be undone.
        </p>
        <div>
          <label for="deletePassword" class="mb-1.5 block text-sm font-medium text-slate-300">
            Confirm with your password
          </label>
          <input
            id="deletePassword"
            name="deletePassword"
            type="password"
            required
            class="w-full max-w-md rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading()}
          class="rounded-full bg-red-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
        >
          {deleteConfirm() ? 'Confirm delete account' : 'Delete account'}
        </button>
      </form>
    </div>
  );
}
