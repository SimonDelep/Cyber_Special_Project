import { DB_UNAVAILABLE_MESSAGE, isPrismaUnavailable } from "@/lib/errors";

export type DbQueryResult<T> = {
  data: T;
  dbError: null;
} | {
  data: null;
  dbError: string;
};

/** Run a Prisma query; return a friendly message instead of crashing when DB is down. */
export async function queryDb<T>(fn: () => Promise<T>): Promise<DbQueryResult<T>> {
  try {
    const data = await fn();
    return { data, dbError: null };
  } catch (err) {
    if (isPrismaUnavailable(err)) {
      return { data: null, dbError: DB_UNAVAILABLE_MESSAGE };
    }
    throw err;
  }
}
