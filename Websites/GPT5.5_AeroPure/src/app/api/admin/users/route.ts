import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { jsonSuccess } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      balance: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess({
    users: users.map((u) => ({
      ...u,
      balance: Number(u.balance),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
  });
}
