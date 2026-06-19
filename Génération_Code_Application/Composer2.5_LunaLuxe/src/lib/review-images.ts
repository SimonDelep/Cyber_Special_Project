import { mkdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from '@/lib/auth/constants';

const uploadsDir = join(fileURLToPath(new URL('../../public/uploads/reviews', import.meta.url)));

function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
}

export function validateReviewImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Image URL must use http or https.';
    }
    return null;
  } catch {
    return 'Please enter a valid image URL.';
  }
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mime] ?? '.jpg';
}

export function saveReviewImageFile(userId: number, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      reject(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      reject(new Error('Image must be smaller than 2 MB.'));
      return;
    }

    ensureUploadsDir();

    const ext = extname(file.name) || mimeToExt(file.type);
    const filename = `review-${userId}-${Date.now()}${ext}`;
    const filepath = join(uploadsDir, filename);

    file
      .arrayBuffer()
      .then((buffer) => {
        writeFileSync(filepath, Buffer.from(buffer));
        resolve(`/uploads/reviews/${filename}`);
      })
      .catch(reject);
  });
}

export function deleteLocalReviewImage(imageUrl: string | null): void {
  if (!imageUrl?.startsWith('/uploads/reviews/')) return;
  const filepath = join(fileURLToPath(new URL('../../public', import.meta.url)), imageUrl);
  if (existsSync(filepath)) {
    try {
      unlinkSync(filepath);
    } catch {
      // ignore
    }
  }
}
