import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="text-sm font-medium transition-colors hover:text-accent"
      >
        {user.username}
      </Link>
      {isAdmin(user) && (
        <Link
          href="/admin"
          className="rounded-full border border-accent px-3 py-1 text-xs font-medium text-accent"
        >
          Admin
        </Link>
      )}
      <LogoutButton className="text-sm text-muted transition-colors hover:text-foreground" />
    </div>
  );
}
