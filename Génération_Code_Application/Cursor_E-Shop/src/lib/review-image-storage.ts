import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";

const REVIEW_IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "reviews"
);

export function reviewImageKey(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export function reviewImagePublicPath(key: string, ext: string): string {
  return `/uploads/reviews/${key}.${ext}`;
}

export function isLocalReviewImagePath(imageUrl: string | null | undefined): boolean {
  return typeof imageUrl === "string" && imageUrl.startsWith("/uploads/reviews/");
}

export async function removeReviewImageFiles(key: string): Promise<void> {
  try {
    const files = await readdir(REVIEW_IMAGE_DIR);
    const prefix = `${key}.`;
    await Promise.all(
      files
        .filter((name) => name.startsWith(prefix))
        .map((name) => unlink(path.join(REVIEW_IMAGE_DIR, name)))
    );
  } catch {
    // Directory may not exist yet.
  }
}

export async function saveReviewImageFile(
  userId: string,
  productId: string,
  data: Buffer,
  ext: string
): Promise<string> {
  const key = reviewImageKey(userId, productId);
  await mkdir(REVIEW_IMAGE_DIR, { recursive: true });
  await removeReviewImageFiles(key);
  const filename = `${key}.${ext}`;
  await writeFile(path.join(REVIEW_IMAGE_DIR, filename), data);
  return reviewImagePublicPath(key, ext);
}
