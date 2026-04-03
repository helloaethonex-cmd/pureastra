"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useIsAdmin,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAddProductImage,
  useDeleteProductImage,
} from "@/hooks/useAdmin";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useProducts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faEdit,
  faTrash,
  faPlus,
  faSave,
  faTimes,
  faImage,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { Product } from "@/services/api";
import Image from "next/image";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Variant = {
  variantName: string;
  sku: string;
  price: string;
  stockQuantity: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const deleteProductImage = useDeleteProductImage();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    brand: "",
    isActive: true,
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { variantName: "", sku: "", price: "", stockQuantity: "" },
  ]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addImageMutation = useAddProductImage(uploadingImageFor || "");

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">
        <div className="text-[#5E2B16] animate-pulse">Checking access…</div>
      </div>
    );
  }

  if (!isAdmin) {
    router.replace("/");
    return null;
  }

  const products = productsData?.data || [];

  const handleNameChange = (name: string) => {
    setForm((p) => ({ ...p, name, slug: autoSlug ? slugify(name) : p.slug }));
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((p) =>
      p.includes(id) ? p.filter((c) => c !== id) : [...p, id]
    );
  };

  const updateVariant = (i: number, key: keyof Variant, val: string) => {
    setVariants((v) =>
      v.map((row, idx) => (idx === i ? { ...row, [key]: val } : row))
    );
  };

  const addVariant = () =>
    setVariants((v) => [
      ...v,
      { variantName: "", sku: "", price: "", stockQuantity: "" },
    ]);

  const removeVariant = (i: number) =>
    setVariants((v) => v.filter((_, idx) => idx !== i));

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      brand: product.brand || "",
      isActive: product.isActive,
    });
    setAutoSlug(false);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", brand: "", isActive: true });
    setAutoSlug(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const validVariants = variants
        .filter((v) => v.variantName || v.sku || v.price)
        .map((v) => ({
          variantName: v.variantName || undefined,
          sku: v.sku || undefined,
          price: v.price ? Number(v.price) : undefined,
          stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : undefined,
        }));

      const created = await createProduct.mutateAsync({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        brand: form.brand || undefined,
        isActive: form.isActive,
        categoryIds:
          selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        variants: validVariants.length > 0 ? validVariants : undefined,
      });

      setSuccess(`Product "${created.name}" created!`);
      setForm({ name: "", slug: "", description: "", brand: "", isActive: true });
      setSelectedCategoryIds([]);
      setVariants([{ variantName: "", sku: "", price: "", stockQuantity: "" }]);
      setAutoSlug(true);
      setShowCreateForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to create product");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setError(null);
    setSuccess(null);

    try {
      await updateProduct.mutateAsync({
        id: editingId,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        brand: form.brand || undefined,
        isActive: form.isActive,
      });
      setSuccess(`Product updated!`);
      cancelEdit();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to update product");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProduct.mutateAsync(id);
      setSuccess(`Product "${name}" deleted!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to delete product");
    }
  };

  const handleImageUpload = async (productId: string) => {
    if (!imageFile) {
      setError("Please select an image file");
      return;
    }

    try {
      if (!uploadingImageFor || uploadingImageFor !== productId) {
        setError("Image upload state is out of sync. Please retry.");
        return;
      }

      await addImageMutation.mutateAsync({ file: imageFile });
      setSuccess("Image uploaded successfully!");
      setUploadingImageFor(null);
      setImageFile(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to upload image");
    }
  };

  const handleDeleteImage = async (productId: string, imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await deleteProductImage.mutateAsync({ productId, imageId });
      setSuccess("Image deleted!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to delete image");
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[#819744] hover:text-[#5E2B16] mb-8 transition text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9E6E5B] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
            <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">
              Manage Products
            </h1>
          </div>

          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingId(null);
              setForm({ name: "", slug: "", description: "", brand: "", isActive: true });
              setSelectedCategoryIds([]);
              setVariants([{ variantName: "", sku: "", price: "", stockQuantity: "" }]);
              setAutoSlug(true);
            }}
            className="px-4 py-2 bg-[#9E6E5B] hover:bg-[#8a5e4e] text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
          >
            <FontAwesomeIcon icon={showCreateForm ? faTimes : faPlus} />
            {showCreateForm ? "Cancel" : "New Product"}
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#EBF1DC] border border-[#819744] text-[#5C6936] rounded-lg px-4 py-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {/* CREATE FORM */}
        {showCreateForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-[#5E2B16] mb-4">
              Create New Product
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Vitamin C Face Wash"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#9E6E5B]"
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
                    setForm((p) => ({ ...p, slug: e.target.value }));
                  }}
                  placeholder="auto-generated"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#9E6E5B] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g. Pureastra"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#9E6E5B]"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                  className="accent-[#9E6E5B] w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#5E2B16]">
                  Active (visible on site)
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5E2B16] mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Product description"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#9E6E5B] resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5E2B16] mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      selectedCategoryIds.includes(cat.id)
                        ? "bg-[#9E6E5B] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#5E2B16]">
                  Variants (optional)
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs text-[#9E6E5B] hover:text-[#7a5644] flex items-center gap-1 font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} /> Add variant
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. 100ml)"
                      value={v.variantName}
                      onChange={(e) =>
                        updateVariant(i, "variantName", e.target.value)
                      }
                      className="border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#9E6E5B]"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      className="border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      className="border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#9E6E5B]"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={v.stockQuantity}
                      onChange={(e) =>
                        updateVariant(i, "stockQuantity", e.target.value)
                      }
                      className="border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#9E6E5B]"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createProduct.isPending}
                className="px-4 py-2 bg-[#9E6E5B] hover:bg-[#8a5e4e] text-white rounded-lg transition disabled:opacity-60 text-sm font-medium"
              >
                {createProduct.isPending ? "Creating…" : "Create Product"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* PRODUCTS LIST */}
        <div className="grid gap-6">
          {productsLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No products yet. Create your first one!
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {editingId === product.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold"
                        />
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, slug: e.target.value }))
                          }
                          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono"
                        />
                        <input
                          type="text"
                          value={form.brand || ""}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, brand: e.target.value }))
                          }
                          placeholder="Brand"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                        />
                        <textarea
                          value={form.description || ""}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, description: e.target.value }))
                          }
                          placeholder="Description"
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm resize-none"
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, isActive: e.target.checked }))
                            }
                            className="accent-[#9E6E5B]"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={updateProduct.isPending}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faSave} /> Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-[#5E2B16]">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {product.slug}
                        </p>
                        {product.brand && (
                          <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                        )}
                        {product.description && (
                          <p className="text-sm text-gray-700 mt-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                          {product.categories && product.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.categories.map((pc) => (
                                <span
                                  key={pc.category.id}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                                >
                                  {pc.category.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {editingId !== product.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteProduct.isPending}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Variants:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="bg-gray-50 px-3 py-1.5 rounded text-xs"
                        >
                          {variant.variantName && (
                            <span className="font-medium">
                              {variant.variantName}
                            </span>
                          )}
                          {variant.price && (
                            <span className="ml-2 text-gray-600">
                              ₹{variant.price}
                            </span>
                          )}
                          {variant.stockQuantity !== null && (
                            <span className="ml-2 text-gray-500">
                              Stock: {variant.stockQuantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">Images:</p>
                    <button
                      onClick={() => setUploadingImageFor(product.id)}
                      className="text-xs text-[#9E6E5B] hover:text-[#7a5644] flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faUpload} /> Upload
                    </button>
                  </div>

                  {uploadingImageFor === product.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                        className="text-xs mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImageUpload(product.id)}
                          disabled={!imageFile || addImageMutation.isPending}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50"
                        >
                          {addImageMutation.isPending ? "Uploading..." : "Upload"}
                        </button>
                        <button
                          onClick={() => {
                            setUploadingImageFor(null);
                            setImageFile(null);
                          }}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {product.images && product.images.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative group w-24 h-24 rounded border border-gray-200 overflow-hidden"
                        >
                          <Image
                            src={image.imageUrl}
                            alt="Product"
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() =>
                              handleDeleteImage(product.id, image.id)
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition text-xs"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No images yet</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
