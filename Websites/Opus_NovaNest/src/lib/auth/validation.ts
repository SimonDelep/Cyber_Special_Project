const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < 3) return 'Username must be at least 3 characters.';
  if (!USERNAME_RE.test(value)) {
    return 'Username may only contain letters, numbers, and underscores.';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!EMAIL_RE.test(value)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validateDisplayName(name: string): string | null {
  const value = name.trim();
  if (value.length < 1) return 'Display name is required.';
  if (value.length > 64) return 'Display name must be 64 characters or less.';
  return null;
}

export function validateAvatarUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Avatar URL must use http or https.';
    }
  } catch {
    return 'Please enter a valid avatar URL.';
  }
  return null;
}
