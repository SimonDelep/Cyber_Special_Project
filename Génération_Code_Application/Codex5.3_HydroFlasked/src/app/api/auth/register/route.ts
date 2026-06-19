import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { formatZodErrors, registerSchema } from "@/lib/auth/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    await logEvent({
      category: "AUTH",
      action: AuditAction.AUTH_REGISTER,
      status: "FAILURE",
      message: "Registration failed: invalid input",
      request,
      metadata: { reason: "validation" },
    });
    return jsonError(formatZodErrors(parsed.error));
  }

  const { username, password, displayName, email } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });
  if (existing) {
    await logEvent({
      category: "AUTH",
      action: AuditAction.AUTH_REGISTER,
      status: "FAILURE",
      message: `Registration failed: username "${normalizedUsername}" taken`,
      username: normalizedUsername,
      request,
      metadata: { reason: "username_taken" },
    });
    return jsonError("Username is already taken", 409);
  }

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      await logEvent({
        category: "AUTH",
        action: AuditAction.AUTH_REGISTER,
        status: "FAILURE",
        message: `Registration failed: email in use for "${normalizedUsername}"`,
        username: normalizedUsername,
        request,
        metadata: { reason: "email_taken" },
      });
      return jsonError("Email is already in use", 409);
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      passwordHash,
      displayName: displayName || null,
      email: email || null,
    },
  });

  await createSession(user.id);

  await logEvent({
    category: "AUTH",
    action: AuditAction.AUTH_REGISTER,
    status: "SUCCESS",
    message: `New account registered: "${user.username}"`,
    userId: user.id,
    username: user.username,
    request,
  });

  const { passwordHash: _, ...safeUser } = user;
  return jsonOk({ user: safeUser }, 201);
}
