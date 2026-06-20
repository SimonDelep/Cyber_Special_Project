"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewImageUrlSchema, reviewSchema } from "@/lib/validations/review";
import type { ActionState } from "@/lib/action-state";
import { toActionError } from "@/lib/errors";
import {
  isLocalReviewImagePath,
  removeReviewImageFiles,
  reviewImageKey,
  saveReviewImageFile,
} from "@/lib/review-image-storage";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TO_EXT,
} from "@/lib/validations/profile";

async function requireAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to leave a review." } as const;
  }
  return { userId: session.user.id, userName: session.user.name } as const;
}

async function resolveReviewImageUrl(
  userId: string,
  productId: string,
  formData: FormData,
  existingImageUrl: string | null | undefined
): Promise<
  | { imageUrl: string | null | undefined; fieldErrors?: ActionState["fieldErrors"] }
  | { error: string }
> {
  const source = formData.get("imageSource");
  const file = formData.get("reviewImageFile");

  if (source === "upload") {
    if (!(file instanceof File) || file.size === 0) {
      return { imageUrl: undefined };
    }

    if (file.size > AVATAR_MAX_BYTES) {
      return {
        fieldErrors: {
          reviewImageFile: ["Image must be 2 MB or smaller."],
        },
      };
    }

    const mime = file.type;
    if (!AVATAR_ALLOWED_MIME.has(mime)) {
      return {
        fieldErrors: {
          reviewImageFile: ["Only JPEG, PNG, WebP, or GIF images are allowed."],
        },
      };
    }

    const ext = AVATAR_MIME_TO_EXT[mime];
    if (!ext) {
      return {
        fieldErrors: {
          reviewImageFile: ["Unsupported image type."],
        },
      };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const publicPath = await saveReviewImageFile(
        userId,
        productId,
        buffer,
        ext
      );
      return { imageUrl: publicPath };
    } catch {
      return { error: "Could not save the uploaded image." };
    }
  }

  if (source === "url") {
    const raw = formData.get("reviewImageUrl");
    const trimmed = typeof raw === "string" ? raw.trim() : "";

    if (!trimmed) {
      if (isLocalReviewImagePath(existingImageUrl)) {
        await removeReviewImageFiles(reviewImageKey(userId, productId));
      }
      return { imageUrl: null };
    }

    const parsed = reviewImageUrlSchema.safeParse({ reviewImageUrl: trimmed });
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    if (
      isLocalReviewImagePath(existingImageUrl) &&
      existingImageUrl !== parsed.data.reviewImageUrl
    ) {
      await removeReviewImageFiles(reviewImageKey(userId, productId));
    }

    return { imageUrl: parsed.data.reviewImageUrl };
  }

  return { imageUrl: undefined };
}

export async function submitReviewAction(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authResult = await requireAuthenticatedUser();
  if ("error" in authResult) {
    return { error: authResult.error };
  }

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: authResult.userId,
        productId,
      },
    },
    select: { imageUrl: true },
  });

  const imageResult = await resolveReviewImageUrl(
    authResult.userId,
    productId,
    formData,
    existing?.imageUrl
  );

  if ("error" in imageResult) {
    return { error: imageResult.error };
  }
  if (imageResult.fieldErrors) {
    return { fieldErrors: imageResult.fieldErrors };
  }

  const data = {
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    ...(imageResult.imageUrl !== undefined
      ? { imageUrl: imageResult.imageUrl }
      : {}),
  };

  try {
    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: authResult.userId,
          productId,
        },
      },
      create: {
        userId: authResult.userId,
        productId,
        ...data,
      },
      update: data,
    });
  } catch (err) {
    return toActionError(err);
  }

  revalidatePath(`/shop/${product.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}

export async function deleteReviewAction(
  productId: string,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const authResult = await requireAuthenticatedUser();
  if ("error" in authResult) {
    return { error: authResult.error };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: authResult.userId,
        productId,
      },
    },
    select: { imageUrl: true },
  });

  try {
    await prisma.review.deleteMany({
      where: {
        userId: authResult.userId,
        productId,
      },
    });

    if (isLocalReviewImagePath(existing?.imageUrl)) {
      await removeReviewImageFiles(
        reviewImageKey(authResult.userId, productId)
      );
    }
  } catch (err) {
    return toActionError(err);
  }

  revalidatePath(`/shop/${product.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}
