import { createPrismaClient } from "@/lib/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function isPrismaClientReady(
  client: ReturnType<typeof createPrismaClient> | undefined,
): client is ReturnType<typeof createPrismaClient> {
  return Boolean(
    client &&
      typeof client.user !== "undefined" &&
      typeof client.order !== "undefined" &&
      typeof client.review !== "undefined" &&
      typeof client.systemLog !== "undefined",
  );
}

function getPrismaClient() {
  if (isPrismaClientReady(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const db = getPrismaClient();
