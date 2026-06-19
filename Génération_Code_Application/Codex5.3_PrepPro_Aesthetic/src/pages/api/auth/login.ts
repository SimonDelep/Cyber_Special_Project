import type { APIRoute } from "astro";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, toPublicUser } from "@/lib/auth/session";
import { findUserByUsernameOrEmail } from "@/db/users";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/validation";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const identifier = String(body.username ?? body.identifier ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      logEventFromRequest(request, {
        eventType: "auth.login.failure",
        status: "failure",
        message: "Login attempt rejected: missing credentials.",
        actorLabel: identifier || null,
        metadata: { reason: "missing_fields" },
      });
      return errorResponse("Username and password are required.", 400);
    }

    const normalized = identifier.includes("@")
      ? normalizeEmail(identifier)
      : normalizeUsername(identifier);

    const user = findUserByUsernameOrEmail(normalized);
    if (!user) {
      logEventFromRequest(request, {
        eventType: "auth.login.failure",
        status: "failure",
        message: `Login failed for identifier "${normalized}".`,
        actorLabel: normalized,
        metadata: { reason: "user_not_found" },
      });
      return errorResponse("Invalid username or password.", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      logEventFromRequest(request, {
        eventType: "auth.login.failure",
        status: "failure",
        userId: user.id,
        actorLabel: user.username,
        message: `Login failed: invalid password for ${user.username}.`,
        metadata: { reason: "invalid_password" },
      });
      return errorResponse("Invalid username or password.", 401);
    }

    await createSession(user.id, cookies);

    logEventFromRequest(request, {
      eventType: "auth.login.success",
      status: "success",
      userId: user.id,
      actorLabel: user.username,
      message: `User ${user.username} signed in.`,
    });

    return jsonResponse({ user: toPublicUser(user) });
  } catch {
    logEventFromRequest(request, {
      eventType: "auth.login.failure",
      status: "failure",
      message: "Login attempt failed due to server error.",
      metadata: { reason: "server_error" },
    });
    return errorResponse("Login failed. Please try again.", 500);
  }
};
