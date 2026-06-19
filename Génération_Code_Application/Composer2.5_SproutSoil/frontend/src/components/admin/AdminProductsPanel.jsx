import { useEffect, useState } from "react";
import { adminApi, formatMoney } from "../../api/client";

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: "herb-garden-kits",
  image_url: "",
};

const CATEGORIES = [
  { value: "herb-garden-kits", label: "Herb Garden Kits" },
  { value: "planters", label: "Planters" },
  { value: "nutrient-mists", label: "Nutrient Mists" },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadProducts = () => {
    setLoading(true);
    adminApi
      .listProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image_url: product.image_url || "",
    });
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyProduct);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !editingId) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      image_url: form.image_url || null,
    };

    try {
      if (editingId) {
        await adminApi.updateProduct(editingId, body);
        setMessage("Product updated.");
      } else {
        await adminApi.createProduct(body);
        setMessage("Product created.");
      }
      loadProducts();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCsvChange = (e) => {
    setCsvFile(e.target.files?.[0] || null);
    setImportResult(null);
    setError("");
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    setError("");
    setMessage("");
    setImportResult(null);

    try {
      const result = await adminApi.importProductsCsv(csvFile);
      setImportResult(result);
      if (result.created > 0) {
        setMessage(
          `Imported ${result.created} product${result.created === 1 ? "" : "s"} from CSV.`
        );
        loadProducts();
      }
      setCsvFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setError("");
    try {
      await adminApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setMessage("Product deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <p className="py-12 text-center text-soil-500">Loading products…</p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-soil-600">{products.length} products in catalog</p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-sprout-500 px-5 py-2 text-sm font-medium text-white hover:bg-sprout-600"
        >
          + Add product
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-soil-200 bg-white p-5">
        <h3 className="font-display text-lg font-bold text-soil-900">Import products from CSV</h3>
        <p className="mt-1 text-sm text-soil-600">
          Upload a CSV with columns:{" "}
          <span className="font-mono text-xs">name, slug, description, price, category, image_url</span>.
          Slug and image URL are optional (slug is auto-generated from the name when empty).
        </p>
        <p className="mt-2 text-sm text-soil-600">
          <a
            href="/samples/products-import-sample.csv"
            download="products-import-sample.csv"
            className="font-medium text-sprout-600 hover:text-sprout-700"
          >
            Download sample CSV
          </a>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="block text-sm font-medium text-soil-700">CSV file</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvChange}
              className="mt-1 block w-full text-sm text-soil-600 file:mr-3 file:rounded-full file:border-0 file:bg-soil-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-soil-700 hover:file:bg-soil-200"
            />
          </div>
          <button
            type="button"
            onClick={handleCsvImport}
            disabled={!csvFile || importing}
            className="rounded-full bg-soil-800 px-5 py-2 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
          >
            {importing ? "Importing…" : "Import CSV"}
          </button>
        </div>
        {importResult?.failed > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p className="font-medium">
              {importResult.failed} row{importResult.failed === 1 ? "" : "s"} could not be imported.
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {importResult.errors.map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-sprout-500/10 px-4 py-3 text-sm text-sprout-700 ring-1 ring-sprout-500/20">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-soil-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-soil-50 text-soil-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soil-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-soil-50/50">
                <td className="px-4 py-3 font-medium text-soil-900">{p.name}</td>
                <td className="px-4 py-3 text-soil-600 capitalize">
                  {p.category.replace(/-/g, " ")}
                </td>
                <td className="px-4 py-3 font-medium">{formatMoney(p.price)}</td>
                <td className="px-4 py-3 text-soil-500 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-sm font-medium text-sprout-600 hover:text-sprout-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-soil-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-soil-900">
                {editingId ? "Edit product" : "New product"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-soil-400 hover:text-soil-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-soil-700">Name</label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">Slug</label>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  value={form.slug}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-soil-700">Price</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.price}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soil-700">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">
                  Image URL (optional)
                </label>
                <input
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-soil-800 py-2.5 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update product" : "Create product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
