import { createSignal, Show } from 'solid-js';

type Mode = 'login' | 'register';

type Props = {
  mode: Mode;
  redirectTo?: string;
};

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-4 py-2.5 text-cork-900 placeholder:text-cork-400 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

export default function AuthForm(props: Props) {
  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [generalError, setGeneralError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const isRegister = () => props.mode === 'register';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    const endpoint = isRegister() ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister()
      ? {
          username: username(),
          email: email(),
          password: password(),
          confirmPassword: confirmPassword(),
        }
      : { username: username(), password: password() };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setGeneralError(data.error ?? 'Something went wrong.');
        }
        return;
      }

      window.location.href = props.redirectTo ?? '/profile';
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      <Show when={generalError()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {generalError()}
        </p>
      </Show>

      <div>
        <label for="username" class="text-sm font-medium text-cork-800">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autocomplete="username"
          required
          class={inputClass}
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
        />
        <Show when={errors().username}>
          <p class="mt-1 text-sm text-red-700">{errors().username}</p>
        </Show>
      </div>

      <Show when={isRegister()}>
        <div>
          <label for="email" class="text-sm font-medium text-cork-800">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class={inputClass}
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
          <Show when={errors().email}>
            <p class="mt-1 text-sm text-red-700">{errors().email}</p>
          </Show>
        </div>
      </Show>

      <div>
        <label for="password" class="text-sm font-medium text-cork-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete={isRegister() ? 'new-password' : 'current-password'}
          required
          class={inputClass}
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
        />
        <Show when={errors().password}>
          <p class="mt-1 text-sm text-red-700">{errors().password}</p>
        </Show>
      </div>

      <Show when={isRegister()}>
        <div>
          <label for="confirmPassword" class="text-sm font-medium text-cork-800">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class={inputClass}
            value={confirmPassword()}
            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
          />
          <Show when={errors().confirmPassword}>
            <p class="mt-1 text-sm text-red-700">{errors().confirmPassword}</p>
          </Show>
        </div>
      </Show>

      <button
        type="submit"
        disabled={loading()}
        class="w-full rounded-full bg-cork-800 px-6 py-3 text-sm font-medium text-cork-50 transition-colors hover:bg-cork-700 disabled:opacity-60"
      >
        {loading() ? 'Please wait…' : isRegister() ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}
