const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3–32 characters (letters, numbers, underscore).';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateProfilePictureUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Profile picture URL must use http or https.';
    }
    return null;
  } catch {
    return 'Please enter a valid profile picture URL.';
  }
}

export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (trimmed.length < 1 || trimmed.length > 64) {
    return 'Display name must be between 1 and 64 characters.';
  }
  return null;
}
