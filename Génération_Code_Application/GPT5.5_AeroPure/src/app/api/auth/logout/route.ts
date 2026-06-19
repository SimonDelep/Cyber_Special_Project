import { getCurrentUser } from "@/lib/auth/session";
import { destroySession } from "@/lib/auth/session";
import { jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { LogCategory, LogLevel } from "@prisma/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  await destroySession();

  if (user) {
    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.AUTH,
      action: LOG_ACTIONS.LOGOUT,
      message: `User "${user.username}" logged out`,
      userId: user.id,
      username: user.username,
      request,
    });
  }

  return jsonSuccess({ message: "Logged out successfully" });
}
