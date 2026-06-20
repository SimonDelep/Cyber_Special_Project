import {
  deleteUploadedImage,
  saveUploadedImage,
} from '../uploads/images';

export function saveAvatarFile(
  buffer: Buffer,
  mimeType: string,
): { publicPath: string } {
  return saveUploadedImage('avatars', buffer, mimeType);
}

export function deleteUploadedAvatar(publicPath: string | null): void {
  deleteUploadedImage('avatars', publicPath);
}
