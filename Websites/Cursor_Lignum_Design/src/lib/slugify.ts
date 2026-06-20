export function slugify(input: string): string {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
