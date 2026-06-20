import { saveImageFile, isValidImageUrl } from "@/lib/uploads/image";

export async function saveAvatarFile(
  userId: string,
  file: File,
): Promise<string> {
  return saveImageFile("avatars", userId, file);
}

export function isValidProfilePictureUrl(url: string): boolean {
  return isValidImageUrl(url);
}
