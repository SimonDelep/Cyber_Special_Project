import Image from "next/image";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { auth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { canAccessAdmin } from "@/lib/auth/rbac";

export async function HeaderAuth() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button href="/login" variant="ghost" className="hidden sm:inline-flex">
          Sign in
        </Button>
        <Button href="/register" variant="secondary" className="hidden sm:inline-flex">
          Register
        </Button>
        <Button href="#subscriptions">Subscribe</Button>
      </div>
    );
  }

  const avatarSrc =
    session.user.image ??
    `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(session.user.username)}`;

  return (
    <div className="flex items-center gap-3">
      {canAccessAdmin(session.user.role) && (
        <Link
          href="/admin"
          className="hidden text-sm text-sage-dark hover:text-espresso sm:inline"
        >
          Admin
        </Link>
      )}
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-full border border-sage/30 py-1 pl-1 pr-3 transition-colors hover:bg-sage/10"
      >
        <span className="relative block h-8 w-8 overflow-hidden rounded-full bg-linen">
          <Image
            src={avatarSrc}
            alt=""
            fill
            className="object-cover"
            unoptimized={
              avatarSrc.startsWith("/uploads/") ||
              avatarSrc.startsWith("http")
            }
          />
        </span>
        <span className="hidden max-w-[100px] truncate text-sm font-medium text-espresso sm:inline">
          {session.user.name ?? session.user.username}
        </span>
      </Link>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" className="!px-4 !py-2 text-sm">
          Logout
        </Button>
      </form>
    </div>
  );
}
