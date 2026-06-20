"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deleteLocalAvatar, isLocalAvatarUrl } from "@/lib/auth/avatar";
import { prisma } from "@/lib/prisma";
import {
  adminAdjustBalanceSchema,
  adminCreateProductSchema,
  adminSetBalanceSchema,
  adminUpdateProductSchema,
  adminUpdateUserSchema,
  dollarsToCents,
} from "@/lib/validations/admin";
import { parseProductCsv, type CsvRowError } from "@/lib/products/parse-product-csv";

export type AdminActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CsvImportActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  rowErrors?: CsvRowError[];
  skippedSlugs?: string[];
};

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function updateUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const parsed = adminUpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    profileImageUrl: formData.get("profileImageUrl"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { userId, name, email, role, profileImageUrl } = parsed.data;

  if (userId === session.user.id && role !== "ADMIN") {
    return { error: "You cannot remove your own administrator role." };
  }

  const normalizedEmail = email?.trim() || null;
  const imageUrl = profileImageUrl?.trim() || null;

  if (normalizedEmail) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: userId } },
    });
    if (emailTaken) {
      return { error: "This email is already used by another account." };
    }
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImageUrl: true },
  });

  if (!current) {
    return { error: "User not found." };
  }

  if (
    current.profileImageUrl &&
    isLocalAvatarUrl(current.profileImageUrl) &&
    current.profileImageUrl !== imageUrl
  ) {
    await deleteLocalAvatar(current.profileImageUrl);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name?.trim() || null,
      email: normalizedEmail,
      role,
      profileImageUrl: imageUrl,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function setBalanceAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const parsed = adminSetBalanceSchema.safeParse({
    userId: formData.get("userId"),
    balanceDollars: formData.get("balanceDollars"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return { error: "User not found." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { balanceCents: dollarsToCents(parsed.data.balanceDollars) },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return { success: true };
}

export async function adjustBalanceAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const parsed = adminAdjustBalanceSchema.safeParse({
    userId: formData.get("userId"),
    adjustmentDollars: formData.get("adjustmentDollars"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return { error: "User not found." };
  }

  const adjustmentCents = dollarsToCents(parsed.data.adjustmentDollars);
  const newBalance = user.balanceCents + adjustmentCents;

  if (newBalance < 0) {
    return { error: "Balance cannot go below zero." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { balanceCents: newBalance },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return { success: true };
}

export async function createProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const parsed = adminCreateProductSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    priceDollars: formData.get("priceDollars"),
    imageUrl: formData.get("imageUrl"),
    featured: formData.has("featured"),
    inStock: formData.has("inStock"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "A product with this slug already exists." };
  }

  const product = await prisma.product.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      priceCents: dollarsToCents(parsed.data.priceDollars),
      imageUrl: parsed.data.imageUrl?.trim() || null,
      featured: parsed.data.featured,
      inStock: parsed.data.inStock,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const parsed = adminUpdateProductSchema.safeParse({
    productId: formData.get("productId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    priceDollars: formData.get("priceDollars"),
    imageUrl: formData.get("imageUrl"),
    featured: formData.has("featured"),
    inStock: formData.has("inStock"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { productId, slug, ...rest } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { error: "Product not found." };
  }

  const slugTaken = await prisma.product.findFirst({
    where: { slug, NOT: { id: productId } },
  });
  if (slugTaken) {
    return { error: "Another product already uses this slug." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      slug,
      name: rest.name,
      description: rest.description,
      category: rest.category,
      priceCents: dollarsToCents(rest.priceDollars),
      imageUrl: rest.imageUrl?.trim() || null,
      featured: rest.featured,
      inStock: rest.inStock,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteProductAction(productId: string): Promise<AdminActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { error: "Product not found." };
  }

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

const MAX_CSV_BYTES = 512 * 1024;

export async function importProductsCsvAction(
  _prev: CsvImportActionState,
  formData: FormData,
): Promise<CsvImportActionState> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Administrator access required." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select a CSV file to import." };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "File must be a .csv spreadsheet." };
  }

  if (file.size > MAX_CSV_BYTES) {
    return { error: "CSV file is too large (maximum 512 KB)." };
  }

  const content = await file.text();
  const parsed = parseProductCsv(content);

  if (!parsed.ok) {
    return {
      error: parsed.error,
      rowErrors: parsed.rowErrors,
    };
  }

  const slugs = parsed.rows.map((row) => row.slug);
  const existing = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((product) => product.slug));

  const rowsToCreate = parsed.rows.filter((row) => !existingSlugs.has(row.slug));
  const skippedSlugs = parsed.rows
    .filter((row) => existingSlugs.has(row.slug))
    .map((row) => row.slug);

  if (rowsToCreate.length === 0) {
    return {
      error: "All products in this file already exist (duplicate slugs).",
      skippedSlugs,
    };
  }

  await prisma.product.createMany({
    data: rowsToCreate.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      priceCents: row.priceCents,
      imageUrl: row.imageUrl ?? null,
      featured: row.featured,
      inStock: row.inStock,
    })),
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/import");
  revalidatePath("/");
  revalidatePath("/products");

  const createdCount = rowsToCreate.length;
  const skippedCount = skippedSlugs.length;
  let message = `${createdCount} product${createdCount === 1 ? "" : "s"} imported successfully.`;

  if (skippedCount > 0) {
    message += ` ${skippedCount} row${skippedCount === 1 ? "" : "s"} skipped (slug already in catalog).`;
  }

  return {
    success: true,
    message,
    skippedSlugs: skippedSlugs.length > 0 ? skippedSlugs : undefined,
  };
}
