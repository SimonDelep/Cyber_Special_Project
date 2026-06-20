import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { saveAvatarFile } from "@/lib/auth/upload";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const result = await saveAvatarFile(session.user.id, file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: result.publicPath },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      message: "Avatar uploaded",
      avatarUrl: user.avatarUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload avatar" },
      { status: 500 },
    );
  }
}
