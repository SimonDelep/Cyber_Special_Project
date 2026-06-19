import type { APIRoute } from "astro";
import { resolveAuthUser } from "@/lib/auth";
import { pathWithMessage, readFormString } from "@/lib/http";
import { getProductBySlug } from "@/lib/products";
import {
  createProductReview,
  parseRating,
} from "@/lib/reviews";

export const POST: APIRoute = async ({
  params,
  request,
  locals,
  cookies,
  redirect,
}) => {
  const user = resolveAuthUser(locals, cookies);
  const slug = params.slug?.trim();
  const productPath = slug ? `/catalog/${slug}` : "/catalog";

  if (!user) {
    const redirectTo = encodeURIComponent(productPath);
    return redirect(
      pathWithMessage(
        `/login?redirect=${redirectTo}`,
        "error",
        "Sign in to submit a review.",
      ),
    );
  }

  if (!slug) {
    return redirect(pathWithMessage("/catalog", "error", "Product not found."));
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return redirect(pathWithMessage("/catalog", "error", "Product not found."));
  }

  const formData = await request.formData();
  const rating = parseRating(await readFormString(formData, "rating"));
  if (!rating) {
    return redirect(
      pathWithMessage(productPath, "error", "Select a rating from 1 to 5 stars."),
    );
  }

  const title = await readFormString(formData, "title");
  const body = await readFormString(formData, "body");
  const imageUrl = await readFormString(formData, "image_url");
  const imageFile = formData.get("image_file");

  const result = await createProductReview({
    productId: product.id,
    userId: user.id,
    rating,
    title,
    body,
    imageUrl,
    imageFile: imageFile instanceof File ? imageFile : null,
  });

  if (result.error) {
    return redirect(pathWithMessage(productPath, "error", result.error));
  }

  return redirect(
    pathWithMessage(productPath, "success", "Thank you — your review was published."),
  );
};
