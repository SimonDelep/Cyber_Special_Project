import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_BYTES } from '@/lib/auth/constants';

const UPLOAD_DIR = resolve(process.cwd(), 'public', 'uploads', 'reviews');

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function saveReviewImageFile(
  reviewId: string,
  file: File,
): Promise<string> {
  if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
    throw new Error('Review image must be JPEG, PNG, WebP, or GIF.');
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('Review image must be 2 MB or smaller.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT_BY_TYPE[file.type] ?? (extname(file.name) || '.jpg');
  const filename = `${reviewId}-${Date.now()}${ext}`;
  const diskPath = resolve(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(diskPath, buffer);

  return `/uploads/reviews/${filename}`;
}

export async function deleteReviewImage(imagePath: string | null): Promise<void> {
  if (!imagePath?.startsWith('/uploads/reviews/')) return;
  const diskPath = resolve(process.cwd(), 'public', imagePath.replace(/^\//, ''));
  try {
    await unlink(diskPath);
  } catch {
    // ignore
  }
}
