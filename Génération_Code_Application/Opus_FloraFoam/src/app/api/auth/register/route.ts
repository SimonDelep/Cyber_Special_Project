import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { username, password, name, email } = parsed.data;
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email?.trim() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    if (existing) {
      const message =
        existing.username === normalizedUsername
          ? "This username is already taken."
          : "This email is already registered.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash,
        name: name?.trim() || null,
        email: normalizedEmail,
        role: Role.USER,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
