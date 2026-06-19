import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import {
  adminCreateCategoryAction,
  adminCreateProductAction,
  adminDeleteCategoryAction,
  adminImportProductsFromCsvAction,
  adminUpdateCategoryAction,
  adminUpdateProductAction,
  adminUpdateUserAction,
} from "./actions";

const PRODUCTS_PAGE_SIZE = 25;

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const sp = (await searchParams) ?? {};
  const productsPageRaw = typeof sp.productsPage === "string" ? sp.productsPage : "1";
  const productsPage = Math.max(1, Number(productsPageRaw || "1") || 1);
  const productsQ = typeof sp.productsQ === "string" ? sp.productsQ.trim() : "";

  const csvCreated = typeof sp.csvCreated === "string" ? Number(sp.csvCreated) : null;
  const csvErrors = typeof sp.csvErrors === "string" ? Number(sp.csvErrors) : null;
  const csvErrorPreview =
    typeof sp.csvErrorPreview === "string" ? decodeURIComponent(sp.csvErrorPreview) : null;
  const csvError = typeof sp.csvError === "string" ? sp.csvError : null;
  const csvMessage = typeof sp.csvMessage === "string" ? decodeURIComponent(sp.csvMessage) : null;

  const productsWhere = productsQ
    ? {
        OR: [
          { name: { contains: productsQ, mode: "insensitive" as const } },
          { slug: { contains: productsQ, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, products, categories] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        points: true,
        balance: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      where: productsWhere,
      take: PRODUCTS_PAGE_SIZE,
      skip: (productsPage - 1) * PRODUCTS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAt: true,
        stock: true,
        featured: true,
        status: true,
        images: true,
        categoryId: true,
        updatedAt: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
    }),
  ]);

  const productsTotal = await prisma.product.count({ where: productsWhere });
  const productsTotalPages = Math.max(1, Math.ceil(productsTotal / PRODUCTS_PAGE_SIZE));
  const productsPrevPage = productsPage > 1 ? productsPage - 1 : null;
  const productsNextPage = productsPage < productsTotalPages ? productsPage + 1 : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="mt-2 text-muted">Gestion des utilisateurs, produits et points.</p>
        </div>
        <Link
          href="/admin/logs"
          className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition-colors hover:bg-border/40"
        >
          Logs système
        </Link>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-serif text-2xl font-semibold">Utilisateurs</h2>
          <p className="mt-2 text-sm text-muted">Derniers 25 inscrits.</p>

          <div className="mt-6 space-y-6">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-sm text-muted">{u.email}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(u.createdAt).toLocaleString("fr-CA")}
                  </p>
                </div>

                <form action={adminUpdateUserAction} className="mt-4 grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="userId" value={u.id} />

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Rôle</span>
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Points</span>
                    <input
                      name="points"
                      type="number"
                      min={0}
                      defaultValue={u.points}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Balance</span>
                    <input
                      name="balance"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={Number(u.balance)}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-serif text-2xl font-semibold">Catégories</h2>
          <p className="mt-2 text-sm text-muted">Créer, modifier, supprimer.</p>

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="font-medium">Créer une catégorie</h3>
            <form action={adminCreateCategoryAction} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Nom</span>
                  <input
                    name="name"
                    placeholder="Ex: Chambre"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Slug</span>
                  <input
                    name="slug"
                    placeholder="ex: chambre"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Description</span>
                <textarea
                  name="description"
                  placeholder="Optionnel"
                  className="min-h-16 w-full rounded-lg border border-border bg-surface px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Image URL</span>
                <input
                  name="imageUrl"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                />
              </label>

              <button
                type="submit"
                className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Créer
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-6">
            {categories.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">
                    {c.name}{" "}
                    <span className="text-sm font-normal text-muted">
                      ({c.slug}) • {c._count.products} produits
                    </span>
                  </p>
                </div>

                <form action={adminUpdateCategoryAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="categoryId" value={c.id} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Nom</span>
                      <input
                        name="name"
                        defaultValue={c.name}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                        required
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Slug</span>
                      <input
                        name="slug"
                        defaultValue={c.slug}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                        required
                      />
                    </label>
                  </div>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Description</span>
                    <textarea
                      name="description"
                      defaultValue={c.description ?? ""}
                      className="min-h-16 w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Image URL</span>
                    <input
                      name="imageUrl"
                      defaultValue={c.imageUrl ?? ""}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Mettre à jour
                    </button>

                    <button
                      formAction={adminDeleteCategoryAction}
                      type="submit"
                      name="categoryId"
                      value={c.id}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
                    >
                      Supprimer
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-8 lg:col-span-2">
          <h2 className="font-serif text-2xl font-semibold">Produits</h2>
          <p className="mt-2 text-sm text-muted">Tous les produits (pagination + recherche).</p>

          {csvCreated !== null && !Number.isNaN(csvCreated) && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                csvCreated > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <p className="font-medium">Import CSV terminé</p>
              <p className="mt-1">
                {csvCreated} produit(s) créé(s)
                {csvErrors !== null && !Number.isNaN(csvErrors) && csvErrors > 0
                  ? ` • ${csvErrors} ligne(s) ignorée(s) ou en erreur`
                  : ""}
              </p>
              {csvErrorPreview && (
                <p className="mt-2 text-xs opacity-90">{csvErrorPreview}</p>
              )}
            </div>
          )}

          {csvError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p className="font-medium">Import CSV échoué</p>
              <p className="mt-1">
                {csvError === "empty" && "Aucun fichier sélectionné."}
                {csvError === "file_too_large" && "Fichier trop volumineux (max. 2 Mo)."}
                {csvError === "invalid_type" && "Le fichier doit être au format .csv."}
                {csvError === "no_categories" &&
                  "Créez au moins une catégorie avant d’importer des produits."}
                {csvError === "parse" && (csvMessage || "Format CSV invalide.")}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="font-medium">Importer des produits (CSV)</h3>
            <p className="mt-2 text-sm text-muted">
              Colonnes : <code className="text-xs">name</code>,{" "}
              <code className="text-xs">description</code>,{" "}
              <code className="text-xs">price</code>,{" "}
              <code className="text-xs">categorySlug</code> (ou{" "}
              <code className="text-xs">categoryId</code>). Optionnel : slug, compareAt,
              stock, status, featured, images, material, dimensions, weight.
            </p>
            <form
              action={adminImportProductsFromCsvAction}
              encType="multipart/form-data"
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <label className="flex-1 space-y-1 text-sm min-w-[200px]">
                <span className="font-medium">Fichier CSV</span>
                <input
                  name="csvFile"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background"
                />
              </label>
              <button
                type="submit"
                disabled={categories.length === 0}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Importer
              </button>
            </form>
            <p className="mt-3 text-xs text-muted">
              Max. 200 lignes par fichier •{" "}
              <a
                href="/samples/products-import.csv"
                download
                className="underline underline-offset-2 hover:text-foreground"
              >
                Télécharger un modèle CSV
              </a>
            </p>
            {categories.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Catégories disponibles :{" "}
                {categories.map((c) => c.slug).join(", ")}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="font-medium">Rechercher</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                name="productsQ"
                defaultValue={productsQ}
                placeholder="Nom ou slug..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Filtrer
              </button>
            </form>
            <p className="mt-3 text-xs text-muted">
              Résultats: {productsTotal} • Page {productsPage} / {productsTotalPages}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="font-medium">Créer un produit</h3>
            <form action={adminCreateProductAction} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Nom</span>
                  <input
                    name="name"
                    placeholder="Ex: Table en chêne"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Slug</span>
                  <input
                    name="slug"
                    placeholder="ex: table-en-chene"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Description</span>
                <textarea
                  name="description"
                  placeholder="Décrivez le produit..."
                  className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Prix</span>
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Compare at</span>
                  <input
                    name="compareAt"
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    placeholder="Optionnel"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Catégorie</span>
                  <select
                    name="categoryId"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                    defaultValue={categories[0]?.id ?? ""}
                  >
                    {categories.length === 0 ? (
                      <option value="" disabled>
                        Aucune catégorie (créez-en une d’abord)
                      </option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Stock</span>
                  <input
                    name="stock"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Statut</span>
                  <select
                    name="status"
                    defaultValue="DRAFT"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 self-end text-sm">
                  <input name="featured" type="checkbox" className="h-4 w-4 rounded border-border" />
                  <span className="font-medium">Featured</span>
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Images (URLs séparées par virgules ou lignes)</span>
                <textarea
                  name="images"
                  placeholder="https://...\nhttps://..."
                  className="min-h-16 w-full rounded-lg border border-border bg-surface px-3 py-2"
                />
              </label>

              <button
                type="submit"
                disabled={categories.length === 0}
                className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Créer
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-6">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted">{p.slug}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleString("fr-CA")}
                  </p>
                </div>

                <form action={adminUpdateProductAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="productId" value={p.id} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Nom</span>
                      <input
                        name="name"
                        defaultValue={p.name}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Slug</span>
                      <input
                        name="slug"
                        defaultValue={p.slug}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Description</span>
                    <textarea
                      name="description"
                      defaultValue={p.description}
                      className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Prix</span>
                      <input
                        name="price"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={Number(p.price)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Compare at</span>
                      <input
                        name="compareAt"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={p.compareAt ? Number(p.compareAt) : undefined}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                        placeholder="Optionnel"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Catégorie</span>
                      <select
                        name="categoryId"
                        defaultValue={p.categoryId}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Stock</span>
                      <input
                        name="stock"
                        type="number"
                        min={0}
                        defaultValue={p.stock}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Statut</span>
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 self-end text-sm">
                      <input
                        name="featured"
                        type="checkbox"
                        defaultChecked={p.featured}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="font-medium">Featured</span>
                    </label>
                  </div>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Images (URLs séparées par virgules ou lignes)</span>
                    <textarea
                      name="images"
                      defaultValue={p.images.join("\n")}
                      className="min-h-16 w-full rounded-lg border border-border bg-surface px-3 py-2"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Mettre à jour
                  </button>
                </form>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-muted">
              Page {productsPage} / {productsTotalPages}
            </div>
            <div className="flex gap-2">
              {productsPrevPage ? (
                <a
                  href={`/admin?productsPage=${productsPrevPage}${
                    productsQ ? `&productsQ=${encodeURIComponent(productsQ)}` : ""
                  }`}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
                >
                  Précédent
                </a>
              ) : (
                <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium opacity-50">
                  Précédent
                </span>
              )}

              {productsNextPage ? (
                <a
                  href={`/admin?productsPage=${productsNextPage}${
                    productsQ ? `&productsQ=${encodeURIComponent(productsQ)}` : ""
                  }`}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
                >
                  Suivant
                </a>
              ) : (
                <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium opacity-50">
                  Suivant
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

