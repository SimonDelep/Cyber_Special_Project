import { defineMiddleware } from "astro:middleware";
import { resolveUserFromCookies } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";

const AUTH_PAGES = new Set(["/login", "/register"]);
const PROTECTED_PREFIXES = ["/profile"];
const ADMIN_PREFIXES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  locals.user = resolveUserFromCookies(cookies);

  if (locals.user && AUTH_PAGES.has(pathname)) {
    return redirect("/profile");
  }

  if (!locals.user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const nextParam = encodeURIComponent(pathname);
    return redirect(`/login?next=${nextParam}`);
  }

  if (matchesPrefix(pathname, ADMIN_PREFIXES)) {
    if (!locals.user) {
      return redirect(`/login?next=${encodeURIComponent(pathname)}`);
    }
    if (!isAdmin(locals.user)) {
      return redirect("/profile?error=forbidden");
    }
  }

  return next();
});
