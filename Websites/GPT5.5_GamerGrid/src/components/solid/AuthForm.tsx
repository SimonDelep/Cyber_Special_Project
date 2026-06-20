import { createSignal, Show } from 'solid-js';

type Mode = 'login' | 'register';

interface Props {
  mode: Mode;
  redirectTo?: string;
}

export default function AuthForm(props: Props) {
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const endpoint =
    props.mode === 'login' ? '/api/auth/login' : '/api/auth/register';

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload: Record<string, string> = {
      username: String(data.get('username') ?? ''),
      password: String(data.get('password') ?? ''),
    };

    if (props.mode === 'register') {
      payload.email = String(data.get('email') ?? '');
      payload.displayName = String(data.get('displayName') ?? '');
    }

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
      window.location.href = props.redirectTo ?? '/profile';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      <Show when={error()}>
        <p class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {error()}
        </p>
      </Show>

      <div>
        <label for="username" class="mb-1.5 block text-sm font-medium text-slate-300">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autocomplete="username"
          class="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          placeholder="jane_doe"
        />
      </div>

      <Show when={props.mode === 'register'}>
        <div>
          <label for="displayName" class="mb-1.5 block text-sm font-medium text-slate-300">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autocomplete="name"
            class="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            placeholder="Jane Doe"
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
            autocomplete="email"
            class="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
            placeholder="jane@example.com"
          />
        </div>
      </Show>

      <div>
        <label for="password" class="mb-1.5 block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autocomplete={props.mode === 'login' ? 'current-password' : 'new-password'}
          class="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
          placeholder="••••••••"
        />
        <Show when={props.mode === 'register'}>
          <p class="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </Show>
      </div>

      <button
        type="submit"
        disabled={loading()}
        class="w-full rounded-full bg-volt-600 py-3 text-sm font-semibold text-white hover:bg-volt-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
      >
        {loading()
          ? 'Please wait…'
          : props.mode === 'login'
            ? 'Sign in'
            : 'Create account'}
      </button>
    </form>
  );
}
