"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import type { ActionState } from "@/lib/action-state";
import {
  AuditAction,
  logAuditEventWithRequest,
} from "@/lib/audit";
import { DB_UNAVAILABLE_MESSAGE, toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logAuditEventWithRequest({
        action: AuditAction.REGISTER_FAILURE,
        severity: "WARN",
        userEmail: email,
        details: { reason: "email_exists" },
      });
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    await logAuditEventWithRequest({
      action: AuditAction.REGISTER_SUCCESS,
      userId: created.id,
      userEmail: created.email,
      details: { name: created.name },
    });
  } catch (err) {
    return toActionError(err, {
      P2002: "An account with this email already exists.",
    });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (err instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." };
    }
    return toActionError(err);
  }

  return { success: true };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/account";

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    if (err instanceof Error && err.message === "DATABASE_UNAVAILABLE") {
      return { error: DB_UNAVAILABLE_MESSAGE };
    }
    return toActionError(err);
  }

  return { success: true };
}

export async function logoutAction() {
  const { auth, signOut } = await import("@/auth");
  const { AuditAction, logAuditEventWithRequest } = await import("@/lib/audit");

  const session = await auth();
  if (session?.user) {
    await logAuditEventWithRequest({
      action: AuditAction.LOGOUT,
      userId: session.user.id,
      userEmail: session.user.email,
    });
  }

  await signOut({ redirectTo: "/" });
}
