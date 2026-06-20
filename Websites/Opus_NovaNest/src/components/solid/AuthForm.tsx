import { createSignal, Show } from 'solid-js';

type Mode = 'login' | 'register';

interface Props {
  mode: Mode;
  redirectTo?: string;
}

export default function AuthForm(props: Props) {
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const isRegister = () => props.mode === 'register';

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    const payload: Record<string, string> = {
      username: String(data.get('username') ?? ''),
      password: String(data.get('password') ?? ''),
    };

    if (isRegister()) {
      payload.email = String(data.get('email') ?? '');
      payload.displayName = String(data.get('displayName') ?? '');
      const avatarUrl = String(data.get('avatarUrl') ?? '').trim();
      if (avatarUrl) payload.avatarUrl = avatarUrl;
    }

    const endpoint = isRegister() ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Request failed.');
        return;
      }
      const target = props.redirectTo || '/profile';
      window.location.href = target;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      <Show when={error()}>
        <p class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error()}
        </p>
      </Show>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-nest-100/80" for="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={32}
          autocomplete="username"
          class="w-full rounded-lg border border-white/15 bg-nest-900 px-4 py-2.5 text-white placeholder:text-nest-100/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="jane_doe"
        />
      </div>

      <Show when={isRegister()}>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-nest-100/80" for="displayName">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            maxLength={64}
            autocomplete="name"
            class="w-full rounded-lg border border-white/15 bg-nest-900 px-4 py-2.5 text-white placeholder:text-nest-100/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-nest-100/80" for="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-white/15 bg-nest-900 px-4 py-2.5 text-white placeholder:text-nest-100/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-nest-100/80" for="avatarUrl">
            Profile picture URL <span class="text-nest-100/40">(optional)</span>
          </label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            class="w-full rounded-lg border border-white/15 bg-nest-900 px-4 py-2.5 text-white placeholder:text-nest-100/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </Show>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-nest-100/80" for="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autocomplete={isRegister() ? 'new-password' : 'current-password'}
          class="w-full rounded-lg border border-white/15 bg-nest-900 px-4 py-2.5 text-white placeholder:text-nest-100/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="••••••••"
        />
        <Show when={isRegister()}>
          <p class="mt-1 text-xs text-nest-100/50">At least 8 characters.</p>
        </Show>
      </div>

      <button
        type="submit"
        disabled={loading()}
        class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-nest-950 transition hover:bg-accent/90 disabled:opacity-50"
      >
        {loading() ? 'Please wait…' : isRegister() ? 'Create account' : 'Log in'}
      </button>
    </form>
  );
}
