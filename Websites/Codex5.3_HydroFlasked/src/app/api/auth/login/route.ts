import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { formatZodErrors, loginSchema } from "@/lib/auth/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    await logEvent({
      category: "AUTH",
      action: AuditAction.AUTH_LOGIN,
      status: "FAILURE",
      message: "Login failed: invalid input",
      request,
      metadata: { reason: "validation" },
    });
    return jsonError(formatZodErrors(parsed.error));
  }

  const { username, password } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await logEvent({
      category: "AUTH",
      action: AuditAction.AUTH_LOGIN,
      status: "FAILURE",
      message: `Login failed for username "${normalizedUsername}"`,
      username: normalizedUsername,
      request,
      metadata: { reason: "invalid_credentials" },
    });
    return jsonError("Invalid username or password", 401);
  }

  await createSession(user.id);

  await logEvent({
    category: "AUTH",
    action: AuditAction.AUTH_LOGIN,
    status: "SUCCESS",
    message: `User "${user.username}" signed in`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { role: user.role },
  });

  const { passwordHash: _, ...safeUser } = user;
  return jsonOk({ user: safeUser });
}
