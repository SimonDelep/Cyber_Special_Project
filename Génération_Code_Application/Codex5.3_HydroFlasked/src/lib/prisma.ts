import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../generated/prisma/client";

/** Bump when prisma/schema.prisma changes to invalidate cached dev clients. */
const PRISMA_SCHEMA_VERSION = "20260604210000_add_orders";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

function isStaleClient(client: PrismaClient | undefined): boolean {
  if (!client) return true;
  if (globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) return true;
  if (typeof (client as PrismaClient & { user?: unknown }).user === "undefined") {
    return true;
  }
  if (!("balanceCents" in Prisma.UserScalarFieldEnum)) return true;
  if (typeof (client as PrismaClient & { review?: unknown }).review === "undefined") {
    return true;
  }
  if (typeof (client as PrismaClient & { systemLog?: unknown }).systemLog === "undefined") {
    return true;
  }
  return typeof (client as PrismaClient & { order?: unknown }).order === "undefined";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStaleClient(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  return client;
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma && !isStaleClient(globalForPrisma.prisma)
        ? globalForPrisma.prisma
        : createPrismaClient())
    : getPrismaClient();

if (process.env.NODE_ENV === "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
