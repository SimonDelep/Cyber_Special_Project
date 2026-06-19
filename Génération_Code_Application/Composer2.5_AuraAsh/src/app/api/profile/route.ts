import { NextResponse } from "next/server";
import { destroySession, getCurrentUser, requireAuth } from "@/lib/auth";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: EventCategory.PROFILE,
        action: "PROFILE_UPDATE",
        status: EventStatus.FAILURE,
        message: "Profile update failed: invalid input",
        userId: currentUser.id,
        username: currentUser.username,
        request,
      });

      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { username, email, firstName, lastName, bio, profilePicture } =
      parsed.data;

    if (username !== currentUser.username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        );
      }
    }

    const normalizedEmail = email || null;
    if (normalizedEmail && normalizedEmail !== currentUser.email) {
      const taken = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username,
        email: normalizedEmail,
        firstName: firstName || null,
        lastName: lastName || null,
        bio: bio || null,
        profilePicture: profilePicture || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        profilePicture: true,
        balance: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const changedFields = Object.entries({
      username,
      email: normalizedEmail,
      firstName: firstName || null,
      lastName: lastName || null,
      bio: bio || null,
      profilePicture: profilePicture || null,
    })
      .filter(([key, value]) => {
        const previous = currentUser[key as keyof typeof currentUser];
        return previous !== value;
      })
      .map(([key]) => key);

    await logEvent({
      category: EventCategory.PROFILE,
      action: "PROFILE_UPDATE",
      status: EventStatus.SUCCESS,
      message: `Profile updated for "${user.username}"`,
      userId: user.id,
      username: user.username,
      metadata: { changedFields },
      request,
    });

    return NextResponse.json({
      user: { ...user, balance: decimalToNumber(user.balance) },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await logEvent({
      category: EventCategory.PROFILE,
      action: "PROFILE_UPDATE",
      status: EventStatus.FAILURE,
      message: "Profile update failed: server error",
      request,
    });

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAuth();

    await prisma.user.delete({ where: { id: currentUser.id } });
    await destroySession();

    await logEvent({
      category: EventCategory.PROFILE,
      action: "PROFILE_DELETE",
      status: EventStatus.SUCCESS,
      message: `Account deleted for "${currentUser.username}"`,
      userId: currentUser.id,
      username: currentUser.username,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await logEvent({
      category: EventCategory.PROFILE,
      action: "PROFILE_DELETE",
      status: EventStatus.FAILURE,
      message: "Account deletion failed: server error",
      request,
    });

    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
