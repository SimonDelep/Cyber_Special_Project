import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await destroySession();

    await logEvent({
      category: EventCategory.AUTH,
      action: "LOGOUT",
      status: EventStatus.SUCCESS,
      message: user
        ? `User "${user.username}" signed out`
        : "Anonymous logout request processed",
      userId: user?.id,
      username: user?.username,
      request,
    });

    return NextResponse.json({ success: true });
  } catch {
    await logEvent({
      category: EventCategory.AUTH,
      action: "LOGOUT",
      status: EventStatus.FAILURE,
      message: "Logout failed: server error",
      request,
    });

    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
