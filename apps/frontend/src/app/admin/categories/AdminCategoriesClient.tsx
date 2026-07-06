"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLayerGroup,
  faPen,
  faTrash,
  faPlus,
  faTimes,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import {
  useCreateCategory,
  useDeleteCategory,
  useIsAdmin,
  useUpdateCategory,
} from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useProducts";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => (categories ?? []).filter((c) => c.id !== editingId),
    [categories, editingId],
  );

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">
        <div className="text-[#5E2B16] animate-pulse">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    router.replace("/");
    return null;
  }

  const resetForm = () => {
    setEditingId(null);
    setAutoSlug(true);
    setForm({ name: "", slug: "", description: "", parentId: "" });
    setShowCreateForm(false);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const created = await createCategory.mutateAsync({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        parentId: form.parentId || undefined,
      });
      setMessage(`Category \"${created.name}\" created.`);
      resetForm();
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to create category");
    }
  };

  const startEdit = (id: string) => {
    const selected = categories?.find((cat) => cat.id === id);
    if (!selected) return;
    setEditingId(id);
    setShowCreateForm(false);
    setAutoSlug(false);
    setForm({
      name: selected.name,
      slug: selected.slug,
      description: selected.description ?? "",
      parentId: selected.parentId ?? "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setError(null);
    setMessage(null);

    try {
      const updated = await updateCategory.mutateAsync({
        id: editingId,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        parentId: form.parentId || undefined,
      });
      setMessage(`Category \"${updated.name}\" updated.`);
      resetForm();
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category \"${name}\"?`)) return;

    setError(null);
    setMessage(null);

    try {
      await deleteCategory.mutateAsync(id);
      setMessage(`Category \"${name}\" deleted.`);
      if (editingId === id) resetForm();
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to delete category");
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[#819744] hover:text-[#5E2B16] mb-8 transition text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#819744] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">
              Manage Categories
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showCreateForm) {
                resetForm();
                return;
              }
              setEditingId(null);
              setAutoSlug(true);
              setForm({ name: "", slug: "", description: "", parentId: "" });
              setShowCreateForm(true);
            }}
            className="px-4 py-2 bg-[#819744] hover:bg-[#6d8039] text-white rounded-lg transition inline-flex items-center gap-2 text-sm"
          >
            <FontAwesomeIcon icon={showCreateForm ? faTimes : faPlus} />
            {showCreateForm ? "Cancel" : "New Category"}
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="bg-[#EBF1DC] border border-[#819744] text-[#5C6936] rounded-lg px-4 py-3 mb-4 text-sm">
            {message}
          </div>
        ) : null}

        {(showCreateForm || editingId) && (
          <form
            onSubmit={editingId ? handleUpdate : handleCreate}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-[#5E2B16] mb-4">
              {editingId ? "Edit Category" : "Create Category"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Name
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Parent Category
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
                >
                  <option value="">None (top-level)</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
                className="px-4 py-2 bg-[#9E6E5B] hover:bg-[#8a5e4e] text-white rounded-lg transition inline-flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} />
                {editingId ? "Save Changes" : "Create Category"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 text-sm text-[#6f665b]">
            {categoriesLoading ? "Loading categories..." : `${categories?.length ?? 0} categories`}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F2ECDF] text-[#5E2B16]">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-left px-4 py-3">Parent</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(categories ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={4}>
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  (categories ?? []).map((cat) => {
                    const parent = categories?.find((c) => c.id === cat.parentId);
                    return (
                      <tr key={cat.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{cat.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cat.slug}</td>
                        <td className="px-4 py-3">{parent?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(cat.id)}
                              className="px-3 py-1 rounded bg-[#EDE3D2] text-[#5E2B16] hover:bg-[#e0d4bf] inline-flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon={faPen} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 inline-flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
