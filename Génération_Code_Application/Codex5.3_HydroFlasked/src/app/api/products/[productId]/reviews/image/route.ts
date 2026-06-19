import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { saveReviewImageFile, validateReviewImageFile } from "@/lib/reviews/image";

type RouteContext = { params: Promise<{ productId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return jsonError("Not authenticated", 401);

    const { productId } = await context.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return jsonError("Product not found", 404);

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return jsonError("No image file provided");
    }

    const validationError = validateReviewImageFile(file);
    if (validationError) return jsonError(validationError);

    const imageUrl = await saveReviewImageFile(sessionUser.id, file);

    return jsonOk({ imageUrl });
  } catch (err) {
    console.error("Review image upload error:", err);
    return jsonError("Failed to upload image", 500);
  }
}
