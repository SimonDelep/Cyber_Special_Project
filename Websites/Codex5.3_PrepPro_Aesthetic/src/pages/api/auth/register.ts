import type { APIRoute } from "astro";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  normalizeEmail,
  normalizeUsername,
  validateDisplayName,
  validateEmail,
  validateUsername,
} from "@/lib/auth/validation";
import { createSession } from "@/lib/auth/session";
import { createUser, findUserByEmail, findUserByUsername } from "@/db/users";
import { toPublicUser } from "@/lib/auth/session";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const username = normalizeUsername(String(body.username ?? ""));
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const displayName = String(body.displayName ?? username);

    const errors: string[] = [];
    const userErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const nameErr = validateDisplayName(displayName);
    if (userErr) errors.push(userErr);
    if (emailErr) errors.push(emailErr);
    if (passErr) errors.push(passErr);
    if (nameErr) errors.push(nameErr);

    if (errors.length > 0) {
      logEventFromRequest(request, {
        eventType: "auth.register.failure",
        status: "failure",
        actorLabel: username || null,
        message: "Registration rejected: validation failed.",
        metadata: { errors },
      });
      return errorResponse(errors.join(" "), 400);
    }

    if (findUserByUsername(username)) {
      logEventFromRequest(request, {
        eventType: "auth.register.failure",
        status: "failure",
        actorLabel: username,
        message: `Registration failed: username "${username}" taken.`,
        metadata: { reason: "username_taken" },
      });
      return errorResponse("Username is already taken.", 409);
    }
    if (findUserByEmail(email)) {
      logEventFromRequest(request, {
        eventType: "auth.register.failure",
        status: "failure",
        actorLabel: username,
        message: `Registration failed: email already registered.`,
        metadata: { reason: "email_taken", email },
      });
      return errorResponse("Email is already registered.", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({
      username,
      email,
      passwordHash,
      displayName: displayName.trim(),
      role: "user",
    });

    await createSession(user.id, cookies);

    logEventFromRequest(request, {
      eventType: "auth.register.success",
      status: "success",
      userId: user.id,
      actorLabel: user.username,
      message: `New account registered: ${user.username}.`,
    });

    return jsonResponse({ user: toPublicUser(user) }, 201);
  } catch {
    logEventFromRequest(request, {
      eventType: "auth.register.failure",
      status: "failure",
      message: "Registration failed due to server error.",
      metadata: { reason: "server_error" },
    });
    return errorResponse("Registration failed. Please try again.", 500);
  }
};
