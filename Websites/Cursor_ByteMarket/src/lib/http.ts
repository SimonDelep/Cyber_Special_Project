export function pathWithMessage(
  path: string,
  type: "error" | "success",
  message: string,
): string {
  const url = new URL(path, "http://internal");
  url.searchParams.set(type, message);
  return url.pathname + url.search;
}

export async function readFormString(
  formData: FormData,
  key: string,
): Promise<string> {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readFormCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function readFormInt(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function safeRedirectPath(value: string | null, fallback = "/profile"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
