import { NextResponse } from "next/server";

function clearAuthCookies() {
  const cookieOptions = { path: "/", maxAge: 0 };
  return cookieOptions;
}

export async function GET() {
  const redirectUrl = new URL("/", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("next-auth.session-token", "", clearAuthCookies());
  res.cookies.set("__Secure-next-auth.session-token", "", clearAuthCookies());
  return res;
}

export async function POST() {
  // JWT sessions are stored in a cookie (next-auth.session-token).
  // Clearing the token is enough to log out.
  const redirectUrl = new URL("/", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("next-auth.session-token", "", clearAuthCookies());
  res.cookies.set("__Secure-next-auth.session-token", "", clearAuthCookies());
  return res;
}

