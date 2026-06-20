import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const { username, email, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      await logEvent({
        level: LogLevel.WARN,
        category: LogCategory.AUTH,
        action: LOG_ACTIONS.REGISTER_FAILED,
        message: `Registration failed for "${username}" — already exists`,
        username,
        request,
      });
      if (existing.username === username) {
        return jsonError("Username already taken", 409);
      }
      return jsonError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    await createSession(user.id);

    await logEvent({
      level: LogLevel.SUCCESS,
      category: LogCategory.AUTH,
      action: LOG_ACTIONS.REGISTER_SUCCESS,
      message: `New account registered: "${user.username}"`,
      userId: user.id,
      username: user.username,
      metadata: { email },
      request,
    });

    return jsonSuccess(
      {
        message: "Account created successfully",
        user,
      },
      201,
    );
  } catch {
    return jsonError("Registration failed", 500);
  }
}
