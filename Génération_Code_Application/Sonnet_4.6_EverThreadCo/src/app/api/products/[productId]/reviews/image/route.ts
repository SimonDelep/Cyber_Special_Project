import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { saveReviewImageFile } from "@/lib/auth/upload";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ productId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const result = await saveReviewImageFile(auth.userId, file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Image uploaded",
      imageUrl: result.publicPath,
    });
  } catch {
    return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
  }
}
