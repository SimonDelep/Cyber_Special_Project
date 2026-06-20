import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const REVIEW_DIR = path.join(process.cwd(), "public", "uploads", "reviews");
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isLocalReviewImageUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith("/uploads/reviews/");
}

export async function deleteLocalReviewImage(url: string | null | undefined): Promise<void> {
  if (!url || !isLocalReviewImageUrl(url)) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // File may already be removed
  }
}

export async function saveReviewImageFile(
  userId: string,
  file: File,
): Promise<{ url: string; error?: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { url: "", error: "Only JPEG, PNG, WebP, and GIF images are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { url: "", error: "Image must be 3 MB or smaller." };
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `${userId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(REVIEW_DIR, { recursive: true });
  await writeFile(path.join(REVIEW_DIR, filename), buffer);

  return { url: `/uploads/reviews/${filename}` };
}
