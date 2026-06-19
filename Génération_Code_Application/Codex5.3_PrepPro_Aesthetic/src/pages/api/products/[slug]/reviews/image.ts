import type { APIRoute } from "astro";
import { findProductBySlug } from "@/db/products";
import { saveImageFile } from "@/lib/uploads/images";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const POST: APIRoute = async ({ params, locals, request }) => {
  if (!locals.user) {
    return errorResponse("Sign in to upload a review image.", 401);
  }

  const slug = params.slug;
  if (!slug) return errorResponse("Product not found.", 404);

  const product = findProductBySlug(slug);
  if (!product) return errorResponse("Product not found.", 404);

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Please select an image file.", 400);
    }

    const saved = await saveImageFile(
      file,
      "reviews",
      `${locals.user.id}-${product.id}`,
    );

    if (!saved.ok) {
      return errorResponse(saved.error, 400);
    }

    return jsonResponse({ imageUrl: saved.url });
  } catch {
    return errorResponse("Image upload failed.", 500);
  }
};
