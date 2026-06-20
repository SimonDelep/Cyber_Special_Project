import { AVATAR_UPLOAD_DIR } from './constants';
import { deleteLocalUpload, saveUploadedImage } from '@/lib/uploads/image';

const AVATAR_PUBLIC_PREFIX = '/uploads/avatars';

export async function saveAvatarFile(userId: number, file: File): Promise<string> {
  return saveUploadedImage(
    AVATAR_UPLOAD_DIR,
    AVATAR_PUBLIC_PREFIX,
    String(userId),
    file,
  );
}

export function deleteLocalAvatar(avatarUrl: string | null | undefined): void {
  deleteLocalUpload(avatarUrl, AVATAR_PUBLIC_PREFIX);
}
