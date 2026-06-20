import { createSignal, Show } from "solid-js";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
  next?: string;
};

export default function AuthForm(props: Props) {
  const [mode, setMode] = createSignal<Mode>(props.mode);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const payload: Record<string, string> = {};
    data.forEach((v, k) => {
      payload[k] = String(v);
    });

    const endpoint = mode() === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Request failed.");
        return;
      }

      const redirectTo = props.next && props.next.startsWith("/") ? props.next : "/profile";
      window.location.href = redirectTo;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="mx-auto w-full max-w-md">
      <div class="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <h1 class="font-display text-2xl font-semibold text-ink">
          {mode() === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {mode() === "login"
            ? "Sign in with your username or email."
            : "Join PrepPro Aesthetic to manage your profile and orders."}
        </p>

        <form class="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Show when={mode() === "register"}>
            <div>
              <label class="block text-sm font-medium text-ink" for="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autocomplete="email"
                class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink" for="displayName">
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autocomplete="name"
                class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </Show>

          <div>
            <label class="block text-sm font-medium text-ink" for="username">
              {mode() === "login" ? "Username or email" : "Username"}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autocomplete={mode() === "login" ? "username" : "username"}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink" for="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autocomplete={mode() === "login" ? "current-password" : "new-password"}
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <Show when={mode() === "register"}>
              <p class="mt-1 text-xs text-muted">At least 8 characters.</p>
            </Show>
          </div>

          <Show when={error()}>
            <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error()}
            </p>
          </Show>

          <button
            type="submit"
            disabled={loading()}
            class="w-full rounded-full bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading() ? "Please wait…" : mode() === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-muted">
          {mode() === "login" ? (
            <>
              No account?{" "}
              <button
                type="button"
                class="font-semibold text-brand-700 hover:underline"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                class="font-semibold text-brand-700 hover:underline"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
