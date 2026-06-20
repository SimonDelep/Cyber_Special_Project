import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "@/lib/auth";

const AUTH_PAGES = new Set(["/login", "/register"]);
const PROTECTED_PREFIXES = ["/profile", "/admin", "/api/admin"];

export const onRequest = defineMiddleware(async (context, next) => {
  const authUser = getSessionUser(context.cookies);
  context.locals.authUser = authUser;

  const { pathname } = context.url;

  if (AUTH_PAGES.has(pathname) && authUser) {
    return context.redirect("/profile");
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !authUser) {
    const redirectTo = encodeURIComponent(pathname);
    return context.redirect(`/login?redirect=${redirectTo}`);
  }

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute && authUser?.role !== "admin") {
    return context.redirect("/?error=admin_required");
  }

  return next();
});
