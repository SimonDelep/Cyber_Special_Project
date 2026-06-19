"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { isAdmin } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="hidden text-sm text-sand-500 sm:inline">…</span>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden text-sm text-sand-700 hover:text-sand-900 sm:inline"
        >
          Sign in
        </Link>
        <Button href="/register" variant="primary" className="text-xs sm:text-sm">
          Register
        </Button>
      </div>
    );
  }

  const role = session.user.role as Role;

  return (
    <div className="flex items-center gap-3">
      {isAdmin(role) ? (
        <Link
          href="/admin"
          className="hidden text-sm text-sage-700 hover:text-sage-900 md:inline"
        >
          Admin
        </Link>
      ) : null}
      <Link
        href="/orders"
        className="hidden text-sm text-sand-700 hover:text-sand-900 sm:inline"
      >
        Orders
      </Link>
      <Link
        href="/profile"
        className="flex items-center gap-2 text-sm text-sand-700 hover:text-sand-900"
      >
        {session.user.image ? (
          <span className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-sand-300">
            <Image
              src={session.user.image}
              alt=""
              fill
              className="object-cover"
              unoptimized={session.user.image.startsWith("/uploads/")}
            />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-200 text-xs font-medium text-sand-700">
            {session.user.username?.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate md:inline">
          {session.user.displayName ?? session.user.username}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-sand-600 hover:text-sand-900"
      >
        Sign out
      </button>
    </div>
  );
}
