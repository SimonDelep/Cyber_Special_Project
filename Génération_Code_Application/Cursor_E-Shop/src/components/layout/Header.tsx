import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/account/UserAvatar";
import { CartLink } from "@/components/layout/CartLink";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 text-sm text-white">
            E
          </span>
          <span className="text-lg text-zinc-50">
            E-Shop<span className="text-cyan-400">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <Link href="/#featured" className="transition-colors hover:text-zinc-100">
            Products
          </Link>
          <Link href="/shop" className="transition-colors hover:text-zinc-100">
            Shop
          </Link>
          <Link href="/#categories" className="transition-colors hover:text-zinc-100">
            Categories
          </Link>
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="transition-colors hover:text-cyan-300">
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <CartLink />
          {user ? (
            <>
              <Link
                href="/account"
                className="hidden items-center gap-2 text-zinc-400 transition hover:text-zinc-100 sm:inline-flex"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <span>Account</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-400 transition hover:text-zinc-100"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-cyan-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-cyan-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
