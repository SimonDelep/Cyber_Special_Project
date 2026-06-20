import { FormEvent, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import { ApiError } from "../../api/client";
import FormField from "../../components/FormField";
import type { Product, ProductCreatePayload, ProductUpdatePayload } from "../../types/product";
import { formatCurrency } from "../../utils/format";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  category: "general",
  image_url: "",
  is_active: true,
};

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);

  const isEditing = selectedId !== null && selectedId !== "new";
  const isCreating = selectedId === "new";

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      setProducts(await adminApi.listProducts());
    } catch {
      setError("Could not load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openCreate() {
    setSelectedId("new");
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function openEdit(product: Product) {
    setSelectedId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: String(product.stock),
      category: product.category,
      image_url: product.image_url ?? "",
      is_active: product.is_active,
    });
    setMessage("");
    setError("");
  }

  function closePanel() {
    setSelectedId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload: ProductCreatePayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price,
      stock: parseInt(form.stock, 10) || 0,
      category: form.category.trim() || "general",
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (isCreating) {
        const created = await adminApi.createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setMessage("Product created.");
        closePanel();
      } else if (isEditing && typeof selectedId === "number") {
        const updatePayload: ProductUpdatePayload = { ...payload };
        const updated = await adminApi.updateProduct(selectedId, updatePayload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setMessage("Product updated.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: number) {
    if (!confirm("Delete this product permanently?")) return;
    setError("");
    try {
      await adminApi.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      if (selectedId === productId) closePanel();
      setMessage("Product deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function handleCsvImport() {
    if (!csvFile) {
      setError("Choose a CSV file first.");
      return;
    }
    setImporting(true);
    setError("");
    setMessage("");
    setImportErrors([]);
    try {
      const result = await adminApi.importProductsFromCsv(csvFile);
      await loadProducts();
      setCsvFile(null);
      if (result.failed > 0) {
        setImportErrors(result.errors);
        setMessage(`Imported ${result.created} product(s). ${result.failed} row(s) failed.`);
      } else {
        setMessage(`Successfully imported ${result.created} product(s).`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-aura-600">Manage catalog items, pricing, and inventory.</p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-aura-950 px-5 py-2.5 text-sm font-semibold text-aura-50 hover:bg-aura-800"
        >
          Add product
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      )}
      {error && !isCreating && !isEditing && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-aura-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-aura-950">Import products from CSV</h3>
        <p className="mt-1 text-sm text-aura-600">
          Required columns: <code className="text-xs">name</code>,{" "}
          <code className="text-xs">price</code>. Optional:{" "}
          <code className="text-xs">description</code>, <code className="text-xs">stock</code>,{" "}
          <code className="text-xs">category</code>, <code className="text-xs">image_url</code>,{" "}
          <code className="text-xs">is_active</code> (true/false).
        </p>
        <p className="mt-2 text-sm">
          <a
            href="/samples/products_import_sample.csv"
            download="products_import_sample.csv"
            className="font-semibold text-aura-800 hover:text-aura-950"
          >
            Download sample CSV
          </a>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-aura-700 file:mr-4 file:rounded-full file:border-0 file:bg-aura-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-aura-50"
          />
          <button
            type="button"
            onClick={handleCsvImport}
            disabled={importing || !csvFile}
            className="rounded-full border border-aura-300 px-5 py-2.5 text-sm font-semibold text-aura-800 transition hover:border-aura-400 hover:bg-aura-50 disabled:opacity-60"
          >
            {importing ? "Importing…" : "Upload CSV"}
          </button>
        </div>
        {importErrors.length > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Row errors</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {importErrors.map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className={`${selectedId !== null ? "lg:col-span-3" : "lg:col-span-5"}`}>
          {loading && <p className="text-sm text-aura-600">Loading products…</p>}
          {!loading && (
            <div className="overflow-hidden rounded-2xl border border-aura-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-aura-200 bg-aura-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-aura-800">Product</th>
                    <th className="px-4 py-3 font-semibold text-aura-800">Price</th>
                    <th className="px-4 py-3 font-semibold text-aura-800">Stock</th>
                    <th className="px-4 py-3 font-semibold text-aura-800">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-aura-500">
                        No products yet.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="border-b border-aura-100 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-aura-950">{p.name}</p>
                          <p className="text-xs capitalize text-aura-500">{p.category}</p>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3">{p.stock}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              p.is_active
                                ? "text-green-700"
                                : "text-aura-400 line-through"
                            }
                          >
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="text-sm font-semibold text-aura-800 hover:text-aura-950"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedId !== null && (
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-aura-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-aura-950">
                  {isCreating ? "New product" : "Edit product"}
                </h3>
                <button
                  type="button"
                  onClick={closePanel}
                  className="text-sm text-aura-600 hover:text-aura-950"
                >
                  Close
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-4 space-y-4">
                <FormField
                  id="product-name"
                  label="Name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  required
                />
                <div>
                  <label htmlFor="product-desc" className="mb-1.5 block text-sm font-medium text-aura-800">
                    Description
                  </label>
                  <textarea
                    id="product-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-aura-300 px-4 py-2.5 text-sm focus:border-aura-500 focus:outline-none focus:ring-2 focus:ring-aura-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="product-price"
                    label="Price (CAD)"
                    value={form.price}
                    onChange={(v) => setForm((f) => ({ ...f, price: v }))}
                    required
                  />
                  <FormField
                    id="product-stock"
                    label="Stock"
                    value={form.stock}
                    onChange={(v) => setForm((f) => ({ ...f, stock: v }))}
                    required
                  />
                </div>
                <FormField
                  id="product-category"
                  label="Category"
                  value={form.category}
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  required
                />
                <FormField
                  id="product-image"
                  label="Image URL"
                  value={form.image_url}
                  onChange={(v) => setForm((f) => ({ ...f, image_url: v }))}
                />
                <label className="flex items-center gap-2 text-sm text-aura-800">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded border-aura-300"
                  />
                  Active (visible in store)
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-aura-950 px-5 py-2.5 text-sm font-semibold text-aura-50 hover:bg-aura-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : isCreating ? "Create" : "Save"}
                </button>
                {isEditing && typeof selectedId === "number" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedId)}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
