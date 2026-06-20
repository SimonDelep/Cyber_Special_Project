import { z } from "zod";
import { slugify } from "@/lib/slugify";

const MAX_ROWS = 200;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  nom: "name",
  slug: "slug",
  description: "description",
  desc: "description",
  price: "price",
  prix: "price",
  compareat: "compareAt",
  compare_at: "compareAt",
  categoryid: "categoryId",
  category_id: "categoryId",
  categoryslug: "categorySlug",
  category_slug: "categorySlug",
  categorie: "categorySlug",
  stock: "stock",
  status: "status",
  statut: "status",
  featured: "featured",
  vedette: "featured",
  images: "images",
  image: "images",
  material: "material",
  materiau: "material",
  dimensions: "dimensions",
  weight: "weight",
  poids: "weight",
};

function normalizeHeader(cell: string): string {
  const key = cell
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "_");
  return HEADER_ALIASES[key] ?? key;
}

/** RFC 4180–style CSV parser (comma-separated, quoted fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    if (row.length > 0 || cell.length > 0) {
      pushCell();
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushCell();
    } else if (ch === "\r" && next === "\n") {
      pushRow();
      i++;
    } else if (ch === "\n" || ch === "\r") {
      pushRow();
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell();
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function parseImages(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  return s
    .split(/[|;]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseFeatured(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "oui";
}

const rowSchema = z.object({
  name: z.string().min(1, "name requis").max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1, "description requise"),
  price: z.coerce.number().min(0).max(1_000_000),
  compareAt: z.coerce.number().min(0).max(1_000_000).optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  images: z.array(z.string().min(1)).max(20).default([]),
  material: z.string().max(200).optional(),
  dimensions: z.string().max(200).optional(),
  weight: z.string().max(200).optional(),
});

export type ParsedProductRow = z.infer<typeof rowSchema> & {
  slug: string;
  categoryId: string;
};

export type CsvParseResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rows: ParsedProductRow[];
      rowErrors: { line: number; message: string }[];
    };

export function parseProductsCsv(
  fileText: string,
  categoryById: Map<string, string>,
  categoryBySlug: Map<string, string>,
): CsvParseResult {
  const stripped = fileText.replace(/^\uFEFF/, "").trim();
  if (!stripped) {
    return { ok: false, error: "Le fichier CSV est vide." };
  }

  const table = parseCsv(stripped);
  if (table.length < 2) {
    return {
      ok: false,
      error: "Le CSV doit contenir une ligne d’en-tête et au moins une ligne de produit.",
    };
  }

  const headers = table[0].map(normalizeHeader);
  const required = ["name", "description", "price"];
  for (const col of required) {
    if (!headers.includes(col)) {
      return {
        ok: false,
        error: `Colonne obligatoire manquante : « ${col} ». En-têtes détectés : ${headers.join(", ")}`,
      };
    }
  }

  if (!headers.includes("categoryId") && !headers.includes("categorySlug")) {
    return {
      ok: false,
      error: "Indiquez categoryId ou categorySlug pour chaque produit.",
    };
  }

  const dataRows = table.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return {
      ok: false,
      error: `Maximum ${MAX_ROWS} produits par import.`,
    };
  }

  const rows: ParsedProductRow[] = [];
  const rowErrors: { line: number; message: string }[] = [];
  const slugsInFile = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const line = i + 2;
    const cells = dataRows[i];
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = (cells[idx] ?? "").trim();
    });

    const categoryIdRaw = record.categoryId?.trim();
    const categorySlugRaw = record.categorySlug?.trim();
    let categoryId = categoryIdRaw && categoryById.has(categoryIdRaw) ? categoryIdRaw : "";
    if (!categoryId && categorySlugRaw) {
      categoryId = categoryBySlug.get(slugify(categorySlugRaw)) ?? categoryBySlug.get(categorySlugRaw) ?? "";
    }

    if (!categoryId) {
      rowErrors.push({
        line,
        message: `Catégorie introuvable (${categorySlugRaw || categoryIdRaw || "vide"}).`,
      });
      continue;
    }

    const parsed = rowSchema.safeParse({
      name: record.name,
      slug: record.slug || undefined,
      description: record.description,
      price: record.price,
      compareAt: record.compareAt ? record.compareAt : undefined,
      categoryId,
      stock: record.stock || 0,
      status: (record.status || "DRAFT").toUpperCase(),
      featured: record.featured ? parseFeatured(record.featured) : false,
      images: parseImages(record.images ?? ""),
      material: record.material || undefined,
      dimensions: record.dimensions || undefined,
      weight: record.weight || undefined,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues.map((iss) => iss.message).join("; ");
      rowErrors.push({ line, message: msg });
      continue;
    }

    const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
    if (!slug) {
      rowErrors.push({ line, message: "Impossible de générer un slug valide." });
      continue;
    }

    if (slugsInFile.has(slug)) {
      rowErrors.push({ line, message: `Slug en double dans le fichier : « ${slug} ».` });
      continue;
    }
    slugsInFile.add(slug);

    rows.push({
      ...parsed.data,
      slug,
      categoryId,
    });
  }

  return { ok: true, rows, rowErrors };
}

export const CSV_IMPORT_LIMITS = { MAX_ROWS, MAX_FILE_BYTES };
