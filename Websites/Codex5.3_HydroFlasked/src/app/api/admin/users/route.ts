import { requireAdmin } from "@/lib/auth/admin";
import { toAdminUsers } from "@/lib/admin/serializers";
import { jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ users: toAdminUsers(users) });
}
