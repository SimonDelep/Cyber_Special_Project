import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { createSession, hashPassword } from "@/lib/auth";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: EventCategory.AUTH,
        action: "REGISTER_ATTEMPT",
        status: EventStatus.FAILURE,
        message: "Registration failed: invalid input",
        username: typeof body?.username === "string" ? body.username : null,
        request,
      });

      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { username, password, email } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      const field = existing.username === username ? "Username" : "Email";

      await logEvent({
        category: EventCategory.AUTH,
        action: "REGISTER_ATTEMPT",
        status: EventStatus.FAILURE,
        message: `Registration failed: ${field.toLowerCase()} already taken`,
        username,
        request,
      });

      return NextResponse.json(
        { error: `${field} is already taken` },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email: email || null,
        role: Role.USER,
      },
    });

    await createSession(user.id);

    await logEvent({
      category: EventCategory.AUTH,
      action: "REGISTER_SUCCESS",
      status: EventStatus.SUCCESS,
      message: `New account created for "${username}"`,
      userId: user.id,
      username: user.username,
      request,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    await logEvent({
      category: EventCategory.AUTH,
      action: "REGISTER_ATTEMPT",
      status: EventStatus.FAILURE,
      message: "Registration failed: server error",
      request,
    });

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    );
  }
}
