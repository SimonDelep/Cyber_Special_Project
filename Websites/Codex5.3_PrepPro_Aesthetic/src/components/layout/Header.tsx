import { useStore } from "@nanostores/solid";
import { cartCount } from "@/stores/cart";
import type { PublicUser } from "@/lib/auth/types";
import { Show } from "solid-js";

type Props = {
  user?: PublicUser | null;
};

function UserAvatar(props: { user: PublicUser }) {
  return (
    <Show
      when={props.user.avatarUrl}
      fallback={
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {props.user.displayName.charAt(0).toUpperCase()}
        </span>
      }
    >
      <img
        src={props.user.avatarUrl!}
        alt=""
        class="h-8 w-8 rounded-full border border-brand-200 object-cover"
        width={32}
        height={32}
      />
    </Show>
  );
}

export default function Header(props: Props) {
  const count = useStore(cartCount);
  const user = () => props.user ?? null;

  return (
    <header class="sticky top-0 z-50 border-b border-brand-200/60 bg-surface/90 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" class="flex items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            PP
          </span>
          <span class="font-display text-lg font-semibold tracking-tight text-ink">
            PrepPro <span class="text-brand-600">Aesthetic</span>
          </span>
        </a>

        <nav class="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <a href="/catalog" class="transition hover:text-brand-700">
            Catalog
          </a>
          <a href="/#features" class="transition hover:text-brand-700">
            Why PrepPro
          </a>
          <Show when={user()}>
            <a href="/profile" class="transition hover:text-brand-700">
              Profile
            </a>
          </Show>
          <Show when={user()?.role === "admin"}>
            <a href="/admin" class="transition hover:text-brand-700">
              Admin
            </a>
          </Show>
        </nav>

        <div class="flex items-center gap-3">
          <a
            href="/cart"
            class="relative rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-400 hover:bg-brand-50"
            aria-label={`Cart, ${count()} items`}
          >
            Cart
            {count() > 0 && (
              <span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {count()}
              </span>
            )}
          </a>

          <Show
            when={user()}
            fallback={
              <>
                <a
                  href="/login"
                  class="hidden rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-brand-50 sm:inline-block"
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  class="hidden rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:inline-block"
                >
                  Register
                </a>
              </>
            }
          >
            {(u) => (
              <div class="flex items-center gap-2">
                <a
                  href="/profile"
                  class="flex items-center gap-2 rounded-full border border-brand-200 py-1 pl-1 pr-3 text-sm font-medium text-ink transition hover:bg-brand-50"
                >
                  <UserAvatar user={u()} />
                  <span class="hidden max-w-[8rem] truncate sm:inline">
                    {u().displayName}
                  </span>
                </a>
                <form method="post" action="/api/auth/logout" class="inline">
                  <button
                    type="submit"
                    class="text-sm text-muted hover:text-brand-700"
                  >
                    Logout
                  </button>
                </form>
              </div>
            )}
          </Show>

          <a
            href="/#products"
            class="hidden rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:inline-block"
          >
            Shop now
          </a>
        </div>
      </div>
    </header>
  );
}
