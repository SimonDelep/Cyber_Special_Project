import type { EventCategory, EventSeverity, Prisma } from "@/generated/prisma/client";

export type EventLogFilters = {
  category?: string;
  severity?: string;
  action?: string;
  q?: string;
  page?: string;
};

const PAGE_SIZE = 50;

export function buildEventWhere(filters: EventLogFilters): Prisma.SystemEventWhereInput {
  const where: Prisma.SystemEventWhereInput = {};

  if (filters.category && filters.category !== "all") {
    where.category = filters.category as EventCategory;
  }

  if (filters.severity && filters.severity !== "all") {
    where.severity = filters.severity as EventSeverity;
  }

  if (filters.action?.trim()) {
    where.action = { contains: filters.action.trim(), mode: "insensitive" };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function getEventPage(filters: EventLogFilters) {
  const page = Number.parseInt(filters.page ?? "1", 10);
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

export { PAGE_SIZE };
