import { NextResponse } from "next/server";
import { CART_COOKIE, CART_MAX_AGE_MS } from "@/lib/cart/constants";
import type { CartLine } from "@/lib/cart/types";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: CART_MAX_AGE_MS / 1000,
};

export function jsonWithCart<T extends object>(
  data: T,
  lines: CartLine[],
  status = 200,
) {
  const response = NextResponse.json(data, { status });
  if (lines.length === 0) {
    response.cookies.delete(CART_COOKIE);
  } else {
    response.cookies.set(CART_COOKIE, JSON.stringify(lines), cookieOptions);
  }
  return response;
}
