import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { destroySession, getSessionUser } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getSessionUser();
  await destroySession();

  if (user) {
    await logEvent({
      category: "AUTH",
      action: AuditAction.AUTH_LOGOUT,
      status: "SUCCESS",
      message: `User "${user.username}" signed out`,
      userId: user.id,
      username: user.username,
      request,
    });
  }

  return jsonOk({ success: true });
}
