"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logEvent } from "@/lib/event-log";
import { CSV_IMPORT_LIMITS, parseProductsCsv } from "@/lib/parse-products-csv";
import { slugify } from "@/lib/slugify";

function parseImages(raw: FormDataEntryValue | null): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[\n,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
  points: z.coerce.number().int().min(0).max(1_000_000),
  balance: z.coerce.number().min(0).max(1_000_000),
});

export async function adminUpdateUserAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = {
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
    points: formData.get("points"),
    balance: formData.get("balance"),
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role, points: parsed.data.points, balance: String(parsed.data.balance) },
  });

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

const updateProductSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.coerce.number().min(0).max(1_000_000),
  compareAt: z.coerce.number().min(0).max(1_000_000).optional(),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  images: z.array(z.string().min(1)).max(20),
  featured: z.coerce.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function adminUpdateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = {
    productId: String(formData.get("productId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price"),
    compareAt: formData.get("compareAt") ? formData.get("compareAt") : undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    stock: formData.get("stock"),
    images: parseImages(formData.get("images")),
    featured: formData.get("featured") ? true : false,
    status: String(formData.get("status") ?? ""),
  };

  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: String(parsed.data.price),
      compareAt: parsed.data.compareAt === undefined ? null : String(parsed.data.compareAt),
      categoryId: parsed.data.categoryId,
      stock: parsed.data.stock,
      images: parsed.data.images,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin?updated=1");
}

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.coerce.number().min(0).max(1_000_000),
  compareAt: z.coerce.number().min(0).max(1_000_000).optional(),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  images: z.array(z.string().min(1)).max(20).default([]),
  featured: z.coerce.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function adminCreateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price"),
    compareAt: formData.get("compareAt") ? formData.get("compareAt") : undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    stock: formData.get("stock"),
    images: parseImages(formData.get("images")),
    featured: formData.get("featured") ? true : false,
    status: String(formData.get("status") ?? "DRAFT"),
  };

  const parsed = createProductSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: String(parsed.data.price),
      compareAt: parsed.data.compareAt === undefined ? null : String(parsed.data.compareAt),
      categoryId: parsed.data.categoryId,
      stock: parsed.data.stock,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      images: parsed.data.images,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin?created=1");
}

export async function adminImportProductsFromCsvAction(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();

  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?csvError=empty");
  }

  if (file.size > CSV_IMPORT_LIMITS.MAX_FILE_BYTES) {
    redirect("/admin?csvError=file_too_large");
  }

  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    redirect("/admin?csvError=invalid_type");
  }

  const text = await file.text();
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });

  if (categories.length === 0) {
    redirect("/admin?csvError=no_categories");
  }

  const categoryById = new Map(categories.map((c) => [c.id, c.id]));
  const categoryBySlug = new Map<string, string>();
  for (const c of categories) {
    categoryBySlug.set(c.slug, c.id);
    categoryBySlug.set(slugify(c.slug), c.id);
  }

  const parsed = parseProductsCsv(text, categoryById, categoryBySlug);
  if (!parsed.ok) {
    await logEvent({
      type: "admin.products.csv_import",
      message: "Échec de l’import CSV (fichier invalide)",
      severity: "WARN",
      userId,
      metadata: { error: parsed.error },
    });
    redirect(`/admin?csvError=parse&csvMessage=${encodeURIComponent(parsed.error)}`);
  }

  const slugsToCheck = parsed.rows.map((r) => r.slug);
  const existing =
    slugsToCheck.length > 0
      ? await prisma.product.findMany({
          where: { slug: { in: slugsToCheck } },
          select: { slug: true },
        })
      : [];
  const existingSlugs = new Set(existing.map((p) => p.slug));

  let created = 0;
  const importErrors = [...parsed.rowErrors];

  for (const row of parsed.rows) {
    if (existingSlugs.has(row.slug)) {
      importErrors.push({
        line: 0,
        message: `Slug déjà utilisé en base : « ${row.slug} » (${row.name}).`,
      });
      continue;
    }

    try {
      await prisma.product.create({
        data: {
          name: row.name,
          slug: row.slug,
          description: row.description,
          price: String(row.price),
          compareAt: row.compareAt === undefined ? null : String(row.compareAt),
          categoryId: row.categoryId,
          stock: row.stock,
          featured: row.featured,
          status: row.status,
          images: row.images,
          material: row.material ?? null,
          dimensions: row.dimensions ?? null,
          weight: row.weight ?? null,
        },
      });
      existingSlugs.add(row.slug);
      created++;
    } catch {
      importErrors.push({
        line: 0,
        message: `Erreur à la création de « ${row.slug} ».`,
      });
    }
  }

  await logEvent({
    type: "admin.products.csv_import",
    message: `Import CSV : ${created} produit(s) créé(s), ${importErrors.length} erreur(s)`,
    severity: created > 0 ? "INFO" : "WARN",
    userId,
    metadata: {
      fileName: file.name,
      created,
      errors: importErrors.slice(0, 20),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
  revalidatePath("/");

  const params = new URLSearchParams({
    csvCreated: String(created),
    csvErrors: String(importErrors.length),
  });

  if (importErrors.length > 0) {
    const preview = importErrors
      .slice(0, 5)
      .map((e) => (e.line > 0 ? `L${e.line}: ${e.message}` : e.message))
      .join(" | ");
    if (preview.length <= 400) {
      params.set("csvErrorPreview", preview);
    }
  }

  redirect(`/admin?${params.toString()}`);
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

export async function adminCreateCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
  };

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin?categoryCreated=1");
}

const updateCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

export async function adminUpdateCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
  };

  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  await prisma.category.update({
    where: { id: parsed.data.categoryId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin?categoryUpdated=1");
}

const deleteCategorySchema = z.object({
  categoryId: z.string().min(1),
});

export async function adminDeleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const raw = { categoryId: String(formData.get("categoryId") ?? "") };
  const parsed = deleteCategorySchema.safeParse(raw);
  if (!parsed.success) redirect("/admin?error=1");

  const productsCount = await prisma.product.count({ where: { categoryId: parsed.data.categoryId } });
  if (productsCount > 0) redirect("/admin?categoryHasProducts=1");

  await prisma.category.delete({ where: { id: parsed.data.categoryId } });

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin?categoryDeleted=1");
}

