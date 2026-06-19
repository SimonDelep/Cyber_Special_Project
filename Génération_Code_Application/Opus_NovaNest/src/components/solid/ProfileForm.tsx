import { createSignal, Show, onMount } from 'solid-js';
import { formatPrice } from '../../lib/format';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialUser: User;
  forbidden?: boolean;
}

export default function ProfileForm(props: Props) {
  const [user, setUser] = createSignal<User>(props.initialUser);
  const [message, setMessage] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(
    props.forbidden ? { type: 'err', text: 'You do not have permission to access the admin area.' } : null,
  );
  const [loading, setLoading] = createSignal(false);

  const [email, setEmail] = createSignal(props.initialUser.email);
  const [displayName, setDisplayName] = createSignal(props.initialUser.displayName);
  const [avatarUrl, setAvatarUrl] = createSignal(props.initialUser.avatarUrl ?? '');
  const [currentPassword, setCurrentPassword] = createSignal('');
  const [newPassword, setNewPassword] = createSignal('');
  const [deletePassword, setDeletePassword] = createSignal('');

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'forbidden' && !props.forbidden) {
      setMessage({ type: 'err', text: 'You do not have permission to access the admin area.' });
    }
  });

  async function saveProfile(e: Event) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email(),
          displayName: displayName(),
          avatarUrl: avatarUrl().trim() || null,
          currentPassword: currentPassword() || undefined,
          newPassword: newPassword() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: json.error ?? 'Update failed.' });
        return;
      }
      setUser(json.user);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'ok', text: 'Profile updated successfully.' });
    } catch {
      setMessage({ type: 'err', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(e: Event) {
    e.preventDefault();
    const input = document.getElementById('avatar-file') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setMessage({ type: 'err', text: 'Choose an image file first.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: json.error ?? 'Upload failed.' });
        return;
      }
      setUser(json.user);
      setAvatarUrl(json.user.avatarUrl ?? '');
      input.value = '';
      setMessage({ type: 'ok', text: 'Profile picture uploaded.' });
    } catch {
      setMessage({ type: 'err', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount(e: Event) {
    e.preventDefault();
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    if (!deletePassword()) {
      setMessage({ type: 'err', text: 'Enter your password to confirm deletion.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: json.error ?? 'Deletion failed.' });
        return;
      }
      window.location.href = '/';
    } catch {
      setMessage({ type: 'err', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  const avatarSrc = () => user().avatarUrl;

  return (
    <div class="space-y-10">
      <Show when={message()}>
        {(m) => (
          <p
            class={`rounded-lg border px-4 py-3 text-sm ${
              m().type === 'ok'
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
            role="alert"
          >
            {m().text}
          </p>
        )}
      </Show>

      <section class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Show
          when={avatarSrc()}
          fallback={
            <span class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-nest-800 text-3xl font-semibold text-accent ring-2 ring-white/10">
              {user().displayName.charAt(0).toUpperCase()}
            </span>
          }
        >
          <img
            src={avatarSrc()!}
            alt=""
            class="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-white/10"
            width="96"
            height="96"
          />
        </Show>
        <div class="text-center sm:text-left">
          <h1 class="font-display text-2xl font-semibold text-white">{user().displayName}</h1>
          <p class="text-nest-100/60">@{user().username}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-accent/80">{user().role}</p>
          <p class="mt-2 text-sm text-nest-100/70">
            Account balance:{' '}
            <span class="font-medium text-accent">{formatPrice(user().balanceCents)}</span>
          </p>
        </div>
      </section>

      <form onSubmit={uploadAvatar} class="rounded-2xl border border-white/10 bg-nest-900/50 p-6">
        <h2 class="font-display text-lg font-semibold text-white">Profile picture</h2>
        <p class="mt-1 text-sm text-nest-100/60">
          Upload an image (JPEG, PNG, WebP, GIF — max 2 MB) or set a URL in the form below.
        </p>
        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            id="avatar-file"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="block w-full text-sm text-nest-100/70 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-nest-950"
          />
          <button
            type="submit"
            disabled={loading()}
            class="shrink-0 rounded-lg border border-accent/40 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            Upload image
          </button>
        </div>
      </form>

      <form onSubmit={saveProfile} class="rounded-2xl border border-white/10 bg-nest-900/50 p-6 space-y-5">
        <h2 class="font-display text-lg font-semibold text-white">Profile details</h2>

        <div>
          <label class="mb-1.5 block text-sm text-nest-100/70">Username</label>
          <input
            type="text"
            value={user().username}
            disabled
            class="w-full cursor-not-allowed rounded-lg border border-white/10 bg-nest-950/50 px-4 py-2.5 text-nest-100/50"
          />
          <p class="mt-1 text-xs text-nest-100/40">Username cannot be changed.</p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm text-nest-100/70" for="displayName">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            class="w-full rounded-lg border border-white/15 bg-nest-950 px-4 py-2.5 text-white focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm text-nest-100/70" for="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="w-full rounded-lg border border-white/15 bg-nest-950 px-4 py-2.5 text-white focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm text-nest-100/70" for="avatarUrl">
            Profile picture URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl()}
            onInput={(e) => setAvatarUrl(e.currentTarget.value)}
            placeholder="https://… or leave empty"
            class="w-full rounded-lg border border-white/15 bg-nest-950 px-4 py-2.5 text-white focus:border-accent focus:outline-none"
          />
        </div>

        <div class="border-t border-white/10 pt-5">
          <h3 class="text-sm font-medium text-white">Change password</h3>
          <p class="mt-1 text-xs text-nest-100/50">Leave blank to keep your current password.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm text-nest-100/70" for="currentPassword">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword()}
                onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                class="w-full rounded-lg border border-white/15 bg-nest-950 px-4 py-2.5 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm text-nest-100/70" for="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                minLength={8}
                value={newPassword()}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                class="w-full rounded-lg border border-white/15 bg-nest-950 px-4 py-2.5 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading()}
          class="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-nest-950 hover:bg-accent/90 disabled:opacity-50"
        >
          Save changes
        </button>
      </form>

      <div class="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={logout}
          class="rounded-lg border border-white/20 px-4 py-2 text-sm text-nest-100/80 hover:border-white/40"
        >
          Log out
        </button>
      </div>

      <form
        onSubmit={deleteAccount}
        class="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4"
      >
        <h2 class="font-display text-lg font-semibold text-red-300">Delete account</h2>
        <p class="text-sm text-nest-100/60">
          Permanently remove your account and all sessions. This action cannot be undone.
        </p>
        <div>
          <label class="mb-1.5 block text-sm text-nest-100/70" for="deletePassword">
            Confirm with your password
          </label>
          <input
            id="deletePassword"
            type="password"
            required
            value={deletePassword()}
            onInput={(e) => setDeletePassword(e.currentTarget.value)}
            class="w-full max-w-md rounded-lg border border-red-500/30 bg-nest-950 px-4 py-2.5 text-white focus:border-red-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading()}
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          Delete my account
        </button>
      </form>
    </div>
  );
}
