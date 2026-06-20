import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveAvatarFile } from "@/lib/uploads/avatar";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveAvatarFile(session.user.id, file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { image: result.url },
      select: { image: true },
    });

    return NextResponse.json({ image: user.image });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload image" },
      { status: 500 },
    );
  }
}
