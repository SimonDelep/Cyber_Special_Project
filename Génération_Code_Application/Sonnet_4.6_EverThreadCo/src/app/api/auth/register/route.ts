import { NextResponse } from "next/server";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { username, email, password, displayName } = parsed.data;
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          { email: normalizedEmail },
        ],
      },
    });

    if (existing) {
      const field =
        existing.username === normalizedUsername ? "username" : "email";
      return NextResponse.json(
        { error: `This ${field} is already taken` },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        displayName: displayName?.trim() || null,
        role: "USER",
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    await logEvent({
      category: "AUTH",
      action: EventActions.REGISTER,
      message: `New account registered: @${user.username}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { email: user.email },
    });

    return NextResponse.json(
      { message: "Account created", user },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register]", err);
    const message =
      err instanceof Error ? err.message : "Unable to create account";
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: isDev ? message : "Unable to create account",
      },
      { status: 500 },
    );
  }
}
