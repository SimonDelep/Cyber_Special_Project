import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: EventCategory.AUTH,
        action: "LOGIN_ATTEMPT",
        status: EventStatus.FAILURE,
        message: "Login failed: invalid input",
        username: typeof body?.username === "string" ? body.username : null,
        request,
      });

      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await logEvent({
        category: EventCategory.AUTH,
        action: "LOGIN_ATTEMPT",
        status: EventStatus.FAILURE,
        message: `Failed login attempt for username "${username}"`,
        username,
        request,
      });

      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    await createSession(user.id);

    await logEvent({
      category: EventCategory.AUTH,
      action: "LOGIN_SUCCESS",
      status: EventStatus.SUCCESS,
      message: `User "${username}" signed in successfully`,
      userId: user.id,
      username: user.username,
      metadata: { role: user.role },
      request,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch {
    await logEvent({
      category: EventCategory.AUTH,
      action: "LOGIN_ATTEMPT",
      status: EventStatus.FAILURE,
      message: "Login failed: server error",
      request,
    });

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
