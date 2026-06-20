"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

async function saveUploadedReviewImage(file: File) {
  if (!file || file.size === 0) return undefined;

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = (() => {
    const t = file.type.toLowerCase();
    if (t.includes("png")) return "png";
    if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
    if (t.includes("webp")) return "webp";
    return "bin";
  })();

  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const rel = `/uploads/reviews/${name}`;
  const abs = path.join(process.cwd(), "public", "uploads", "reviews", name);

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);

  return rel;
}

export async function createReviewAction(formData: FormData): Promise<void> {
  const { userId } = await requireUser();

  const raw = {
    productId: String(formData.get("productId") ?? ""),
    rating: formData.get("rating"),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/products/${String(formData.get("slug") ?? "")}?reviewError=1`);
  }

  const file = formData.get("imageFile");
  const imageFile = file instanceof File ? file : undefined;

  let finalImageUrl = parsed.data.imageUrl?.trim() || undefined;
  if (!finalImageUrl && imageFile && imageFile.size > 0) {
    finalImageUrl = await saveUploadedReviewImage(imageFile);
  }

  await prisma.review.upsert({
    where: {
      productId_userId: { productId: parsed.data.productId, userId },
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      imageUrl: finalImageUrl || null,
    },
    create: {
      productId: parsed.data.productId,
      userId,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      imageUrl: finalImageUrl || null,
    },
  });

  revalidatePath(`/products/${String(formData.get("slug") ?? "")}`);
  redirect(`/products/${String(formData.get("slug") ?? "")}#reviews`);
}

