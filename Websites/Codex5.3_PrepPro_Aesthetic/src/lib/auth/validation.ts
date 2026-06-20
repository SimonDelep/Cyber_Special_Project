const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!USERNAME_RE.test(trimmed)) {
    return "Username must be 3–32 characters (letters, numbers, underscore).";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 64) {
    return "Display name must be 1–64 characters.";
  }
  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.length > 500) {
    return "Bio must be at most 500 characters.";
  }
  return null;
}

export function validateAvatarUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "Avatar URL must use http or https.";
    }
  } catch {
    return "Please enter a valid avatar URL.";
  }
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
