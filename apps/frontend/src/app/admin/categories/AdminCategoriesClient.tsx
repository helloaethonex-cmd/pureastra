"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faPen, faPlus, faSave, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  useCreateCategory,
  useDeleteCategory,
  useIsAdmin,
  useUpdateCategory,
} from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useProducts";
import type { Category } from "@/services/api";
import type { DataTableColumn } from "../_components";
import { Button, DataTable, Field, PageHeader, Select, Textarea, TextInput } from "../_components";

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
      <div className="flex min-h-[50vh] items-center justify-center">
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
      setMessage(`Category "${created.name}" created.`);
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
      setMessage(`Category "${updated.name}" updated.`);
      resetForm();
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;

    setError(null);
    setMessage(null);

    try {
      await deleteCategory.mutateAsync(id);
      setMessage(`Category "${name}" deleted.`);
      if (editingId === id) resetForm();
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to delete category");
    }
  };

  const columns: DataTableColumn<Category>[] = [
    { key: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },
    {
      key: "slug",
      header: "Slug",
      render: (row) => <span className="font-mono text-[length:var(--admin-text-xs)]">{row.slug}</span>,
    },
    {
      key: "parent",
      header: "Parent",
      render: (row) => categories?.find((c) => c.id === row.parentId)?.name ?? "-",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Manage Categories"
        breadcrumb="Admin / Categories"
        actions={
          <Button
            size="sm"
            variant={showCreateForm ? "secondary" : "primary"}
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
          >
            <FontAwesomeIcon icon={showCreateForm ? faTimes : faPlus} />
            {showCreateForm ? "Cancel" : "New Category"}
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-[var(--admin-r-md)] bg-[var(--admin-error-bg)] px-4 py-3 text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-[var(--admin-r-md)] bg-[var(--admin-success-bg)] px-4 py-3 text-[length:var(--admin-text-sm)] text-[var(--admin-success-fg)]">
          {message}
        </div>
      ) : null}

      {(showCreateForm || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-6 shadow-[var(--admin-elev-1)]"
        >
          <h2 className="mb-4 text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">
            {editingId ? "Edit Category" : "Create Category"}
          </h2>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Field label="Name" htmlFor="cat-name" required>
              <TextInput
                id="cat-name"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </Field>

            <Field label="Slug" htmlFor="cat-slug" help="Auto-generated from name unless edited">
              <TextInput
                id="cat-slug"
                value={form.slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                className="font-mono"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Description" htmlFor="cat-desc">
                <Textarea
                  id="cat-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Parent Category" htmlFor="cat-parent">
                <Select
                  id="cat-parent"
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                >
                  <option value="">None (top-level)</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              <FontAwesomeIcon icon={faSave} />
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={categories ?? []}
        rowKey={(row) => row.id}
        loading={categoriesLoading}
        emptyIcon={faLayerGroup}
        emptyHeading="No categories yet"
        emptyMessage="Create your first category to start organizing products."
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => startEdit(row.id)}>
              <FontAwesomeIcon icon={faPen} />
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(row.id, row.name)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </Button>
          </div>
        )}
      />
    </div>
  );
}
