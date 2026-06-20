import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: "AUTH",
        action: LogAction.REGISTER_FAILURE,
        message: "Registration failed: validation error",
        request,
        success: false,
      });
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { username, password, name, email } = parsed.data;

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      const field =
        existing.username === username ? "username" : "email";
      await logEvent({
        category: "AUTH",
        action: LogAction.REGISTER_FAILURE,
        message: `Registration failed: ${field} already taken`,
        request,
        metadata: { username, field },
        success: false,
      });
      return NextResponse.json(
        { error: `This ${field} is already taken` },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        username,
        passwordHash,
        name: name || null,
        email: email || null,
        role: "USER",
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    await logEvent({
      category: "AUTH",
      action: LogAction.REGISTER,
      message: `New account registered: ${user.username}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { role: user.role },
      success: true,
    });

    return NextResponse.json(
      { message: "Account created", user },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 500 },
    );
  }
}
