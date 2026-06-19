const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export type FieldErrors = Record<string, string>;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3–32 characters (letters, numbers, underscore).';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

export function validateAvatarUrl(url: string): string | null {
  if (!url.trim()) return null;
  if (!URL_RE.test(url.trim())) {
    return 'Avatar URL must start with http:// or https://';
  }
  return null;
}

export function validateRegistration(input: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const usernameErr = validateUsername(input.username);
  if (usernameErr) errors.username = usernameErr;
  const emailErr = validateEmail(input.email);
  if (emailErr) errors.email = emailErr;
  const passwordErr = validatePassword(input.password);
  if (passwordErr) errors.password = passwordErr;
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export function validateProfileUpdate(input: {
  email?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  username?: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.username !== undefined) {
    const err = validateUsername(input.username);
    if (err) errors.username = err;
  }
  if (input.email !== undefined) {
    const err = validateEmail(input.email);
    if (err) errors.email = err;
  }
  if (input.displayName !== undefined && input.displayName.length > 80) {
    errors.displayName = 'Display name must be 80 characters or fewer.';
  }
  if (input.bio !== undefined && input.bio.length > 500) {
    errors.bio = 'Bio must be 500 characters or fewer.';
  }
  if (input.avatarUrl !== undefined) {
    const err = validateAvatarUrl(input.avatarUrl);
    if (err) errors.avatarUrl = err;
  }
  return errors;
}
