import { NextResponse } from "next/server";
import type { EventCategory, EventStatus } from "@/generated/prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { getLogStats, getSystemLogs } from "@/lib/events/queries";

const CATEGORIES = new Set(["AUTH", "PROFILE", "TRANSACTION", "ADMIN", "ALL"]);
const STATUSES = new Set(["SUCCESS", "FAILURE", "WARNING", "ALL"]);

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category") ?? "ALL";
  const statusParam = searchParams.get("status") ?? "ALL";
  const search = searchParams.get("search") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  const category = CATEGORIES.has(categoryParam)
    ? (categoryParam as EventCategory | "ALL")
    : "ALL";
  const status = STATUSES.has(statusParam)
    ? (statusParam as EventStatus | "ALL")
    : "ALL";

  const [result, stats] = await Promise.all([
    getSystemLogs({ category, status, search, limit, offset }),
    getLogStats(),
  ]);

  return NextResponse.json({ ...result, stats });
}
