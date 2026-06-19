import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await logEvent({
        level: LogLevel.WARN,
        category: LogCategory.AUTH,
        action: LOG_ACTIONS.LOGIN_FAILED,
        message: `Failed login attempt for username "${username}"`,
        username,
        request,
      });
      return jsonError("Invalid username or password", 401);
    }

    await createSession(user.id);

    await logEvent({
      level: LogLevel.SUCCESS,
      category: LogCategory.AUTH,
      action: LOG_ACTIONS.LOGIN_SUCCESS,
      message: `User "${user.username}" logged in successfully`,
      userId: user.id,
      username: user.username,
      request,
    });

    return jsonSuccess({
      message: "Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return jsonError("Login failed", 500);
  }
}
