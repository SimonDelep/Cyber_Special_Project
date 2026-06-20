import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAccountPage = pathname.startsWith("/account");
  const isCartPage = pathname.startsWith("/cart") || pathname.startsWith("/checkout");
  const isAdminPage = pathname.startsWith("/admin");

  if (isAuthPage && isLoggedIn) {
    const redirectTo = role === "ADMIN" ? "/admin/products" : "/account";
    return NextResponse.redirect(new URL(redirectTo, req.nextUrl));
  }

  if ((isAccountPage || isCartPage) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPage) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/account/:path*",
    "/cart",
    "/checkout",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
