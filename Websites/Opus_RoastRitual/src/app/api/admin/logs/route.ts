import { NextResponse } from "next/server";

import type {
  SystemLogCategory,
  SystemLogLevel,
} from "@/generated/prisma/enums";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { querySystemLogs } from "@/lib/monitoring/query-logs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as SystemLogCategory | null;
  const level = searchParams.get("level") as SystemLogLevel | null;
  const successParam = searchParams.get("success");
  const q = searchParams.get("q") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "50");

  const validCategories = ["AUTH", "PROFILE", "TRANSACTION", "ADMIN", "SYSTEM"];
  const validLevels = ["INFO", "WARN", "ERROR"];

  let success: boolean | undefined;
  if (successParam === "true") success = true;
  if (successParam === "false") success = false;

  const result = await querySystemLogs({
    q,
    category:
      category && validCategories.includes(category) ? category : undefined,
    level: level && validLevels.includes(level) ? level : undefined,
    success,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return NextResponse.json(result);
}
