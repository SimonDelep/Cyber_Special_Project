import type { Metadata } from "next";
import { Suspense } from "react";
import { EventLogFilters } from "@/components/admin/EventLogFilters";
import { EventLogTable } from "@/components/admin/EventLogTable";
import {
  buildEventWhere,
  getEventPage,
  PAGE_SIZE,
} from "@/lib/events/query";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "System logs",
};

type LogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLogsPage({ searchParams }: LogsPageProps) {
  const raw = await searchParams;
  const get = (key: string) => {
    const v = raw[key];
    return typeof v === "string" ? v : "";
  };

  const filters = {
    q: get("q"),
    category: get("category") || "all",
    severity: get("severity") || "all",
    action: get("action"),
    page: get("page"),
  };

  const where = buildEventWhere(filters);
  const page = getEventPage(filters);

  const [totalCount, events, recentStats] = await Promise.all([
    prisma.systemEvent.count({ where }),
    prisma.systemEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.systemEvent.groupBy({
      by: ["severity"],
      _count: { id: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const queryParams = new URLSearchParams();
  if (filters.q) queryParams.set("q", filters.q);
  if (filters.category !== "all") queryParams.set("category", filters.category);
  if (filters.severity !== "all") queryParams.set("severity", filters.severity);
  if (filters.action) queryParams.set("action", filters.action);
  const queryString = queryParams.toString();

  const serialized = events.map((e) => ({
    id: e.id,
    category: e.category,
    action: e.action,
    severity: e.severity,
    message: e.message,
    username: e.username,
    userId: e.userId,
    ipAddress: e.ipAddress,
    metadata: e.metadata,
    createdAt: e.createdAt.toISOString(),
  }));

  const warn24h =
    recentStats.find((s) => s.severity === "WARN")?._count.id ?? 0;
  const error24h =
    recentStats.find((s) => s.severity === "ERROR")?._count.id ?? 0;

  return (
    <div>
      <h2 className="font-display text-2xl text-sand-900">System event log</h2>
      <p className="mt-1 text-sm text-sand-600">
        Internal monitoring of authentication, profile changes, checkout
        transactions, and admin actions.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-sand-200 bg-cream-50 p-4">
          <dt className="text-xs text-sand-500">Last 24h warnings</dt>
          <dd className="mt-1 font-display text-2xl text-amber-800">{warn24h}</dd>
        </div>
        <div className="rounded-xl border border-sand-200 bg-cream-50 p-4">
          <dt className="text-xs text-sand-500">Last 24h errors</dt>
          <dd className="mt-1 font-display text-2xl text-red-800">{error24h}</dd>
        </div>
        <div className="rounded-xl border border-sand-200 bg-cream-50 p-4">
          <dt className="text-xs text-sand-500">Total matching</dt>
          <dd className="mt-1 font-display text-2xl text-sand-900">
            {totalCount}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-sand-500">Loading filters…</p>}>
          <EventLogFilters current={filters} />
        </Suspense>
      </div>

      <div className="mt-8">
        <EventLogTable
          events={serialized}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          queryString={queryString}
        />
      </div>
    </div>
  );
}
