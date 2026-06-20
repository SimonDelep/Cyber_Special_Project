"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ActionState } from "@/lib/action-state";
import { toActionError } from "@/lib/errors";
import { AuditAction, logAuditEventWithRequest } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import {
  PRODUCT_CSV_MAX_BYTES,
  parseProductCsvFile,
} from "@/lib/csv/products";
const PRODUCT_SLUG_CONFLICT = {
  P2002: "A product with this slug already exists.",
} as const;

function parseProductForm(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl") || "",
    category: formData.get("category"),
    stock: formData.get("stock") ?? "",
  };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const adminSession = await requireAdmin();

  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  let created;
  try {
    created = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: new Prisma.Decimal(data.price),
        imageUrl: data.imageUrl || null,
        category: data.category,
        stock: data.stock,
      },
    });
  } catch (err) {
    return toActionError(err, PRODUCT_SLUG_CONFLICT);
  }

  await logAuditEventWithRequest({
    action: AuditAction.ADMIN_PRODUCT_CREATE,
    userId: adminSession.user.id,
    userEmail: adminSession.user.email,
    resourceType: "product",
    resourceId: created.id,
    details: { name: created.name, slug: created.slug },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const adminSession = await requireAdmin();

  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!existing) {
    return { error: "Product not found." };
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: new Prisma.Decimal(data.price),
        imageUrl: data.imageUrl || null,
        category: data.category,
        stock: data.stock,
      },
    });
  } catch (err) {
    return toActionError(err, PRODUCT_SLUG_CONFLICT);
  }

  await logAuditEventWithRequest({
    action: AuditAction.ADMIN_PRODUCT_UPDATE,
    userId: adminSession.user.id,
    userEmail: adminSession.user.email,
    resourceType: "product",
    resourceId: productId,
    details: { name: data.name, slug: data.slug },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function importProductsCsvAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const adminSession = await requireAdmin();

  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file to upload." };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Only .csv files are accepted." };
  }

  if (file.size > PRODUCT_CSV_MAX_BYTES) {
    return { error: "CSV file is too large (max 512 KB)." };
  }

  const text = await file.text();
  const parsed = parseProductCsvFile(text);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const importErrors: string[] = [];
  let created = 0;
  const seenSlugs = new Set<string>();

  for (const row of parsed.rows) {
    if ("error" in row) {
      importErrors.push(`Row ${row.rowNumber}: ${row.error}`);
      continue;
    }

    if (seenSlugs.has(row.data.slug)) {
      importErrors.push(
        `Row ${row.rowNumber}: duplicate slug "${row.data.slug}" in this file.`
      );
      continue;
    }
    seenSlugs.add(row.data.slug);

    try {
      await prisma.product.create({
        data: {
          name: row.data.name,
          slug: row.data.slug,
          description: row.data.description || null,
          price: new Prisma.Decimal(row.data.price),
          imageUrl: row.data.imageUrl || null,
          category: row.data.category,
          stock: row.data.stock,
        },
      });
      created++;
    } catch (err) {
      const mapped = toActionError(err, PRODUCT_SLUG_CONFLICT);
      if (mapped.error === PRODUCT_SLUG_CONFLICT.P2002) {
        importErrors.push(
          `Row ${row.rowNumber}: slug "${row.data.slug}" already exists in the catalog.`
        );
      } else {
        importErrors.push(`Row ${row.rowNumber}: ${mapped.error}`);
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");

  if (created === 0) {
    return {
      error: "No products were imported.",
      importErrors,
    };
  }

  await logAuditEventWithRequest({
    action: AuditAction.ADMIN_PRODUCT_IMPORT,
    userId: adminSession.user.id,
    userEmail: adminSession.user.email,
    details: { created, skipped: importErrors.length },
  });

  const message =
    created === 1
      ? "1 product imported successfully."
      : `${created} products imported successfully.`;

  return {
    success: true,
    message:
      importErrors.length > 0
        ? `${message} ${importErrors.length} row(s) were skipped.`
        : message,
    importErrors: importErrors.length > 0 ? importErrors : undefined,
  };
}

export async function deleteProductAction(productId: string): Promise<void> {
  const adminSession = await requireAdmin();

  const existing = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!existing) {
    throw new Error("Product not found.");
  }

  await prisma.product.delete({ where: { id: productId } });

  await logAuditEventWithRequest({
    action: AuditAction.ADMIN_PRODUCT_DELETE,
    userId: adminSession.user.id,
    userEmail: adminSession.user.email,
    resourceType: "product",
    resourceId: productId,
    details: { name: existing.name, slug: existing.slug },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}
