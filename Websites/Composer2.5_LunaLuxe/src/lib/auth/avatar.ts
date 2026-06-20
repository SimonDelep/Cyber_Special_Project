import { mkdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from '@/lib/auth/constants';

const uploadsDir = join(fileURLToPath(new URL('../../../public/uploads/avatars', import.meta.url)));

function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
}

export function validateAvatarUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Avatar URL must use http or https.';
    }
    return null;
  } catch {
    return 'Please enter a valid avatar URL.';
  }
}

export function saveAvatarFile(userId: number, file: File): Promise<string> {
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
    const filename = `user-${userId}-${Date.now()}${ext}`;
    const filepath = join(uploadsDir, filename);

    file
      .arrayBuffer()
      .then((buffer) => {
        writeFileSync(filepath, Buffer.from(buffer));
        resolve(`/uploads/avatars/${filename}`);
      })
      .catch(reject);
  });
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

export function deleteLocalAvatar(avatarUrl: string | null): void {
  if (!avatarUrl?.startsWith('/uploads/avatars/')) return;
  const filepath = join(fileURLToPath(new URL('../../../public', import.meta.url)), avatarUrl);
  if (existsSync(filepath)) {
    try {
      unlinkSync(filepath);
    } catch {
      // ignore missing files
    }
  }
}
