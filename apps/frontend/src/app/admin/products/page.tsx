"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
  faArrowDown,
  faArrowUp,
  faBoxOpen,
  faEdit,
  faTrash,
  faPlus,
  faSave,
  faStar,
  faTimes,
  faImage,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import {
  addProductVariant,
  adjustProductVariantStock,
  assignProductCategories,
  createProductContentSection,
  deleteProductContentSection,
  deleteProductVariant,
  listProductContentSectionsAdmin,
  removeProductCategory,
  setProductCoverImage,
  setProductImagePosition,
  type Product,
  type ProductContentSection,
  type ProductVariant,
  updateProductContentSection,
  updateProductVariant,
} from "@/services/api";
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
  bufferStock: string;
  lowStockThreshold: string;
};

type VariantEditorForm = Variant & {
  isActive: boolean;
};

const createEmptyVariantEditorForm = (): VariantEditorForm => ({
  variantName: "",
  sku: "",
  price: "",
  stockQuantity: "",
  bufferStock: "0",
  lowStockThreshold: "5",
  isActive: true,
});

const optionalNumber = (value: string) =>
  value.trim() ? Number(value) : undefined;

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: productsData, isLoading: productsLoading } = useProducts({
    limit: 100,
  });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const deleteProductImage = useDeleteProductImage();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(
    null,
  );
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
    {
      variantName: "",
      sku: "",
      price: "",
      stockQuantity: "",
      bufferStock: "",
      lowStockThreshold: "5",
    },
  ]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentSectionsByProduct, setContentSectionsByProduct] = useState<
    Record<string, ProductContentSection[]>
  >({});
  const [loadingContentFor, setLoadingContentFor] = useState<string | null>(
    null,
  );
  const [variantEditorModal, setVariantEditorModal] = useState<{
    mode: "add" | "edit";
    productId: string;
    variant?: ProductVariant;
  } | null>(null);
  const [variantEditorForm, setVariantEditorForm] = useState<VariantEditorForm>(
    createEmptyVariantEditorForm(),
  );
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState<{
    productId: string;
    variant: ProductVariant;
  } | null>(null);
  const [stockAdjustmentMode, setStockAdjustmentMode] = useState<
    "adjust" | "setCount"
  >("adjust");
  const [stockAdjustmentQuantity, setStockAdjustmentQuantity] = useState("");
  const [stockActualCount, setStockActualCount] = useState("");
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");
  const [openReservedDetailKey, setOpenReservedDetailKey] = useState<
    string | null
  >(null);

  const addImageMutation = useAddProductImage(uploadingImageFor || "");

  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

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
      p.includes(id) ? p.filter((c) => c !== id) : [...p, id],
    );
  };

  const updateVariant = (i: number, key: keyof Variant, val: string) => {
    setVariants((v) =>
      v.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)),
    );
  };

  const addVariant = () =>
    setVariants((v) => [
      ...v,
      {
        variantName: "",
        sku: "",
        price: "",
        stockQuantity: "",
        bufferStock: "",
        lowStockThreshold: "5",
      },
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
          bufferStock: v.bufferStock ? Number(v.bufferStock) : undefined,
          lowStockThreshold: v.lowStockThreshold
            ? Number(v.lowStockThreshold)
            : undefined,
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
      setForm({
        name: "",
        slug: "",
        description: "",
        brand: "",
        isActive: true,
      });
      setSelectedCategoryIds([]);
      setVariants([
        {
          variantName: "",
          sku: "",
          price: "",
          stockQuantity: "",
          bufferStock: "",
          lowStockThreshold: "5",
        },
      ]);
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

      const product = products.find((p) => p.id === productId);
      const maxPosition = Math.max(
        -1,
        ...(product?.images?.map((img) => Number(img.position ?? 0)) ?? []),
      );
      const nextPosition = maxPosition + 1;

      await addImageMutation.mutateAsync({
        file: imageFile,
        position: nextPosition,
      });
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

  const handleSetCoverImage = async (
    productId: string,
    image: { id: string; imageUrl: string; variantId?: string | null },
  ) => {
    try {
      const product = products.find((p) => p.id === productId);
      const currentCover = product?.images?.find(
        (img) => Number(img.position ?? 0) === 0,
      );

      if (currentCover && currentCover.id !== image.id) {
        await setProductImagePosition(productId, currentCover, 1);
      }

      await setProductCoverImage(productId, image);
      await refreshProducts();
      setSuccess("Cover image updated.");
    } catch (err: any) {
      setError(err.message ?? "Failed to set cover image");
    }
  };

  const handleMoveImage = async (
    productId: string,
    image: {
      id: string;
      imageUrl: string;
      variantId?: string | null;
      position?: number | null;
    },
    delta: number,
  ) => {
    try {
      const nextPosition = Math.max(0, Number(image.position ?? 0) + delta);
      await setProductImagePosition(productId, image, nextPosition);
      await refreshProducts();
      setSuccess("Image order updated.");
    } catch (err: any) {
      setError(err.message ?? "Failed to move image");
    }
  };

  const handleAssignCategoryToProduct = async (
    productId: string,
    categoryId: string,
  ) => {
    if (!categoryId) return;
    try {
      await assignProductCategories(productId, [categoryId]);
      await refreshProducts();
      setSuccess("Category assigned.");
    } catch (err: any) {
      setError(err.message ?? "Failed to assign category");
    }
  };

  const handleRemoveCategoryFromProduct = async (
    productId: string,
    categoryId: string,
  ) => {
    try {
      await removeProductCategory(productId, categoryId);
      await refreshProducts();
      setSuccess("Category removed.");
    } catch (err: any) {
      setError(err.message ?? "Failed to remove category");
    }
  };

  const openAddVariantModal = (productId: string) => {
    setError(null);
    setVariantEditorForm(createEmptyVariantEditorForm());
    setVariantEditorModal({ mode: "add", productId });
  };

  const openEditVariantModal = (productId: string, variant: ProductVariant) => {
    setError(null);
    setVariantEditorForm({
      variantName: variant.variantName ?? "",
      sku: variant.sku ?? "",
      price: variant.price == null ? "" : String(variant.price),
      stockQuantity:
        variant.stockQuantity == null ? "" : String(variant.stockQuantity),
      bufferStock: String(variant.bufferStock ?? 0),
      lowStockThreshold: String(variant.lowStockThreshold ?? 5),
      isActive: variant.isActive,
    });
    setVariantEditorModal({ mode: "edit", productId, variant });
  };

  const updateVariantEditorField = <K extends keyof VariantEditorForm>(
    key: K,
    value: VariantEditorForm[K],
  ) => {
    setVariantEditorForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeVariantEditorModal = () => {
    setVariantEditorModal(null);
    setVariantEditorForm(createEmptyVariantEditorForm());
  };

  const handleSaveVariantEditor = async () => {
    if (!variantEditorModal) return;
    if (!variantEditorForm.variantName.trim()) {
      setError("Variant name is required.");
      return;
    }

    try {
      const basePayload = {
        variantName: variantEditorForm.variantName.trim(),
        sku: variantEditorForm.sku.trim() || undefined,
        price: optionalNumber(variantEditorForm.price),
        bufferStock: optionalNumber(variantEditorForm.bufferStock),
        lowStockThreshold: optionalNumber(variantEditorForm.lowStockThreshold),
      };

      if (variantEditorModal.mode === "add") {
        await addProductVariant(variantEditorModal.productId, {
          ...basePayload,
          stockQuantity: optionalNumber(variantEditorForm.stockQuantity),
          isActive: variantEditorForm.isActive,
        });
      } else if (variantEditorModal.variant) {
        await updateProductVariant(
          variantEditorModal.productId,
          variantEditorModal.variant.id,
          {
            ...basePayload,
            isActive: variantEditorForm.isActive,
          },
        );
      }

      closeVariantEditorModal();
      await refreshProducts();
      setSuccess(
        variantEditorModal.mode === "add"
          ? "Variant added."
          : "Variant updated.",
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to save variant");
    }
  };

  const handleDeleteVariant = async (productId: string, variantId: string) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await deleteProductVariant(productId, variantId);
      await refreshProducts();
      setSuccess("Variant deleted.");
    } catch (err: any) {
      setError(err.message ?? "Failed to delete variant");
    }
  };

  const openStockAdjustmentModal = (
    productId: string,
    variant: ProductVariant,
  ) => {
    setError(null);
    setStockAdjustmentMode("adjust");
    setStockAdjustmentQuantity("");
    setStockActualCount("");
    setStockAdjustmentReason("");
    setStockAdjustmentModal({ productId, variant });
  };

  const handleAdjustVariantStock = async () => {
    if (!stockAdjustmentModal) return;

    const currentStock = Number(
      stockAdjustmentModal.variant.stockQuantity ?? 0,
    );
    let quantity: number | null = null;

    if (stockAdjustmentMode === "adjust") {
      const parsed = Number(stockAdjustmentQuantity);
      if (!Number.isInteger(parsed) || parsed === 0) {
        setError("Enter a non-zero whole number for the stock adjustment.");
        return;
      }
      quantity = parsed;
    } else {
      const actual = Number(stockActualCount);
      if (!Number.isInteger(actual) || actual < 0) {
        setError("Enter a valid whole number (0 or more) for actual count.");
        return;
      }
      quantity = actual - currentStock;
      if (quantity === 0) {
        setError("Actual count matches current stock. No adjustment needed.");
        return;
      }
    }

    if (!stockAdjustmentReason.trim()) {
      setError("Stock adjustment reason is required.");
      return;
    }

    try {
      await adjustProductVariantStock(
        stockAdjustmentModal.productId,
        stockAdjustmentModal.variant.id,
        {
          quantity,
          reason: stockAdjustmentReason.trim(),
        },
      );
      setStockAdjustmentModal(null);
      setStockAdjustmentMode("adjust");
      setStockAdjustmentQuantity("");
      setStockActualCount("");
      setStockAdjustmentReason("");
      await refreshProducts();
      setSuccess("Variant stock adjusted.");
    } catch (err: any) {
      setError(err.message ?? "Failed to adjust stock");
    }
  };

  const closeStockAdjustmentModal = () => {
    setStockAdjustmentModal(null);
    setStockAdjustmentMode("adjust");
    setStockAdjustmentQuantity("");
    setStockActualCount("");
    setStockAdjustmentReason("");
  };

  const handleLoadContentSections = async (productId: string) => {
    try {
      setLoadingContentFor(productId);
      const sections = await listProductContentSectionsAdmin(productId);
      setContentSectionsByProduct((prev) => ({
        ...prev,
        [productId]: sections,
      }));
    } catch (err: any) {
      setError(err.message ?? "Failed to load content sections");
    } finally {
      setLoadingContentFor(null);
    }
  };

  const handleCreateContentSection = async (productId: string) => {
    const sectionType = window.prompt(
      "Section type (BENEFITS, FAQ, SUITABLE_FOR, USAGE_INSTRUCTION, BEFORE_AFTER, INGREDIENTS, HIGHLIGHTS, CUSTOM)",
      "BENEFITS",
    ) as ProductContentSection["sectionType"] | null;
    if (!sectionType) return;

    const title = window.prompt("Title (optional)") || undefined;
    const contentText = window.prompt("Content (JSON or plain text)", "") || "";
    const positionInput = window.prompt("Position", "0") || "0";

    let parsedContent: unknown = contentText;
    if (
      contentText.trim().startsWith("{") ||
      contentText.trim().startsWith("[")
    ) {
      try {
        parsedContent = JSON.parse(contentText);
      } catch {
        setError("Invalid JSON content");
        return;
      }
    }

    try {
      await createProductContentSection(productId, {
        sectionType,
        title,
        content: parsedContent,
        position: Number(positionInput),
      });
      await handleLoadContentSections(productId);
      setSuccess("Content section created.");
    } catch (err: any) {
      setError(err.message ?? "Failed to create content section");
    }
  };

  const handleEditContentSection = async (
    productId: string,
    section: ProductContentSection,
  ) => {
    const sectionId = section.id;
    if (!sectionId) return;

    const title =
      window.prompt("Title", section.title ?? "") ?? section.title ?? undefined;
    const positionInput =
      window.prompt("Position", String(section.position ?? 0)) ??
      String(section.position ?? 0);
    const contentInput =
      window.prompt(
        "Content (JSON or plain text)",
        JSON.stringify(section.content),
      ) ?? JSON.stringify(section.content);

    let parsedContent: unknown = contentInput;
    try {
      parsedContent = JSON.parse(contentInput);
    } catch {
      // keep plain text
    }

    try {
      await updateProductContentSection(productId, sectionId, {
        title: title || undefined,
        position: Number(positionInput),
        content: parsedContent,
      });
      await handleLoadContentSections(productId);
      setSuccess("Content section updated.");
    } catch (err: any) {
      setError(err.message ?? "Failed to update content section");
    }
  };

  const handleDeleteContentSection = async (
    productId: string,
    sectionId?: string,
  ) => {
    if (!sectionId) return;
    if (!confirm("Delete this content section?")) return;

    try {
      await deleteProductContentSection(productId, sectionId);
      await handleLoadContentSections(productId);
      setSuccess("Content section removed.");
    } catch (err: any) {
      setError(err.message ?? "Failed to remove content section");
    }
  };

  const stockModalVariant = stockAdjustmentModal?.variant;
  const stockModalStock = Number(stockModalVariant?.stockQuantity ?? 0);
  const stockModalReserved = Number(stockModalVariant?.stockReserved ?? 0);
  const stockModalBuffer = Number(stockModalVariant?.bufferStock ?? 0);
  const stockModalAvailable = Number(stockModalVariant?.availableStock ?? 0);
  const parsedStockAdjustment = Number(stockAdjustmentQuantity);
  const parsedStockActualCount = Number(stockActualCount);
  const computedStockAdjustment =
    stockAdjustmentMode === "adjust"
      ? Number.isInteger(parsedStockAdjustment)
        ? parsedStockAdjustment
        : null
      : Number.isInteger(parsedStockActualCount) && parsedStockActualCount >= 0
        ? parsedStockActualCount - stockModalStock
        : null;
  const computedAdjustmentSign =
    computedStockAdjustment == null || computedStockAdjustment === 0
      ? ""
      : computedStockAdjustment > 0
        ? "+"
        : "";
  const variantModalAvailable = variantEditorModal?.variant?.availableStock;

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
              setForm({
                name: "",
                slug: "",
                description: "",
                brand: "",
                isActive: true,
              });
              setSelectedCategoryIds([]);
              setVariants([
                {
                  variantName: "",
                  sku: "",
                  price: "",
                  stockQuantity: "",
                  bufferStock: "",
                  lowStockThreshold: "5",
                },
              ]);
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
                  onChange={(e) =>
                    setForm((p) => ({ ...p, brand: e.target.value }))
                  }
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
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-[#5E2B16]"
                >
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
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-[#5E2B16]">
                        Variant {i + 1}
                      </p>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="space-y-1 text-xs font-semibold text-gray-600">
                        <span>Variant name</span>
                        <input
                          type="text"
                          placeholder="100ml"
                          value={v.variantName}
                          onChange={(e) =>
                            updateVariant(i, "variantName", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-normal focus:outline-none focus:border-[#9E6E5B]"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-semibold text-gray-600">
                        <span>SKU</span>
                        <input
                          type="text"
                          placeholder="PA-VCW-100ML"
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(i, "sku", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-mono font-normal focus:outline-none focus:border-[#9E6E5B]"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-semibold text-gray-600">
                        <span>Price</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="₹"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(i, "price", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-normal focus:outline-none focus:border-[#9E6E5B]"
                        />
                      </label>
                    </div>

                    <div className="mt-3 rounded-md bg-[#F8F4EC] p-3">
                      <p className="mb-2 text-xs font-semibold text-[#5E2B16]">
                        Inventory
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="space-y-1 text-xs font-semibold text-gray-600">
                          <span>Stock</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="On-hand stock"
                            value={v.stockQuantity}
                            onChange={(e) =>
                              updateVariant(i, "stockQuantity", e.target.value)
                            }
                            className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-normal focus:outline-none focus:border-[#9E6E5B]"
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-gray-600">
                          <span>Buffer</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Hidden reserve"
                            value={v.bufferStock}
                            onChange={(e) =>
                              updateVariant(i, "bufferStock", e.target.value)
                            }
                            className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-normal focus:outline-none focus:border-[#9E6E5B]"
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-gray-600">
                          <span>Low stock threshold</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Alert level"
                            value={v.lowStockThreshold}
                            onChange={(e) =>
                              updateVariant(
                                i,
                                "lowStockThreshold",
                                e.target.value,
                              )
                            }
                            className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-normal focus:outline-none focus:border-[#9E6E5B]"
                          />
                        </label>
                        <div className="rounded border border-dashed border-[#D6C9B6] px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase text-gray-500">
                            Available
                          </p>
                          <p className="text-sm font-bold text-[#5E2B16]">
                            Calculated after save
                          </p>
                        </div>
                      </div>
                    </div>
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
                            setForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
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
                              setForm((p) => ({
                                ...p,
                                isActive: e.target.checked,
                              }))
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
                          <p className="text-sm text-gray-600">
                            Brand: {product.brand}
                          </p>
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
                          <div className="flex flex-wrap gap-1">
                            {product.categories?.map((pc) => (
                              <button
                                key={pc.category.id}
                                type="button"
                                onClick={() =>
                                  handleRemoveCategoryFromProduct(
                                    product.id,
                                    pc.category.id,
                                  )
                                }
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                                title="Remove category"
                              >
                                {pc.category.name} x
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 max-w-xs">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              void handleAssignCategoryToProduct(
                                product.id,
                                e.target.value,
                              );
                              e.currentTarget.value = "";
                            }}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white"
                          >
                            <option value="">Assign category...</option>
                            {categories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
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
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-600">
                      Variants:
                    </p>
                    <button
                      type="button"
                      onClick={() => openAddVariantModal(product.id)}
                      className="text-xs text-[#9E6E5B] hover:text-[#7a5644]"
                    >
                      + Add variant
                    </button>
                  </div>
                  {product.variants && product.variants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {product.variants.map((variant) => {
                        const reservedDetailKey = `${product.id}:${variant.id}`;
                        const reservedCount = Number(
                          variant.stockReserved ?? 0,
                        );
                        const isReservedDetailOpen =
                          openReservedDetailKey === reservedDetailKey;

                        return (
                          <div
                            key={variant.id}
                            className={`rounded-lg border p-3 text-xs ${
                              variant.isLowStock
                                ? "border-yellow-300 bg-yellow-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-[#5E2B16]">
                                  {variant.variantName || "Variant"}
                                </div>
                                <div className="font-mono text-gray-600">
                                  SKU: {variant.sku || "-"}
                                </div>
                              </div>
                              {variant.isLowStock && (
                                <span className="rounded bg-yellow-200 px-2 py-0.5 font-semibold text-yellow-900">
                                  {reservedCount > 0
                                    ? "Low stock - fast moving"
                                    : "Low stock"}
                                </span>
                              )}
                            </div>
                            <div className="mb-2 rounded-md bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-gray-500">
                                Available
                              </p>
                              <p
                                className={`text-2xl font-bold ${
                                  Number(variant.availableStock ?? 0) <= 0
                                    ? "text-red-600"
                                    : variant.isLowStock
                                      ? "text-[#b35c1e]"
                                      : "text-[#3B7509]"
                                }`}
                              >
                                {variant.availableStock ?? 0}
                              </p>
                              {variant.isLowStock &&
                                Number(variant.availableStock ?? 0) > 0 && (
                                  <p className="text-[11px] font-semibold text-[#b35c1e]">
                                    Only {variant.availableStock ?? 0} left
                                  </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600">
                              <span>Price: ₹{variant.price ?? "-"}</span>
                              <span>Stock: {variant.stockQuantity ?? "-"}</span>
                              {reservedCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenReservedDetailKey((prev) =>
                                      prev === reservedDetailKey
                                        ? null
                                        : reservedDetailKey,
                                    )
                                  }
                                  className="text-left font-semibold text-[#5E2B16] underline decoration-dotted underline-offset-2"
                                >
                                  Reserved: {reservedCount}
                                </button>
                              ) : (
                                <span>Reserved: {reservedCount}</span>
                              )}
                              <span>Buffer: {variant.bufferStock ?? 0}</span>
                              <span className="col-span-2">
                                Low threshold: {variant.lowStockThreshold ?? 5}
                              </span>
                              {isReservedDetailOpen && (
                                <div className="col-span-2 rounded border border-[#E8DFC9] bg-[#FCF8EF] px-2 py-1.5 text-[11px] text-[#5E2B16]">
                                  <p className="font-semibold">
                                    Reservation breakdown
                                  </p>
                                  <p>
                                    Active + Confirmed reservations:{" "}
                                    {reservedCount}
                                  </p>
                                  <p className="text-[10px] text-[#7B6A58]">
                                    This stock is held by pending orders and
                                    cannot be sold until released or fulfilled.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditVariantModal(
                                    product.id,
                                    variant as ProductVariant,
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openStockAdjustmentModal(
                                    product.id,
                                    variant as ProductVariant,
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700"
                              >
                                Stock +/-
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteVariant(product.id, variant.id)
                                }
                                className="px-2 py-0.5 rounded bg-red-100 text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No variants yet</p>
                  )}
                </div>

                {/* Content Sections */}
                <div className="mb-4 border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Content Sections:
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadContentSections(product.id)}
                        className="text-xs text-[#5B8D7C]"
                      >
                        {loadingContentFor === product.id
                          ? "Loading..."
                          : "Load"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateContentSection(product.id)}
                        className="text-xs text-[#9E6E5B]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {(contentSectionsByProduct[product.id] ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {contentSectionsByProduct[product.id].map((section) => (
                        <div
                          key={
                            section.id ??
                            `${section.sectionType}-${section.position}`
                          }
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <div className="font-medium text-[#5E2B16]">
                            {section.sectionType} (pos {section.position})
                          </div>
                          <div className="text-gray-600">
                            {section.title || "No title"}
                          </div>
                          <div className="mt-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditContentSection(product.id, section)
                              }
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteContentSection(
                                  product.id,
                                  section.id,
                                )
                              }
                              className="px-2 py-0.5 rounded bg-red-100 text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No content sections loaded
                    </p>
                  )}
                </div>

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Images:
                    </p>
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
                          {addImageMutation.isPending
                            ? "Uploading..."
                            : "Upload"}
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
                      {[...product.images]
                        .sort(
                          (a, b) =>
                            Number(a.position ?? 0) - Number(b.position ?? 0),
                        )
                        .map((image) => (
                          <div
                            key={image.id}
                            className="relative group w-28 h-28 rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
                          >
                            <Image
                              src={image.imageUrl}
                              alt="Product"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteImage(product.id, image.id)
                              }
                              className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-red-600/95 text-white text-[11px] shadow-sm"
                              title="Delete image"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>

                            <div className="absolute inset-x-1 bottom-1 flex flex-col gap-1">
                              <span className="text-[10px] bg-black/65 text-white rounded px-1.5 py-0.5 text-center">
                                pos {image.position ?? 0}{" "}
                                {Number(image.position ?? 0) === 0
                                  ? "(cover)"
                                  : ""}
                              </span>
                              <div className="grid grid-cols-3 gap-1 opacity-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetCoverImage(product.id, image)
                                  }
                                  className="h-6 rounded bg-green-600/95 text-white text-[10px]"
                                  title="Set as cover"
                                >
                                  <FontAwesomeIcon icon={faStar} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveImage(product.id, image, -1)
                                  }
                                  className="h-6 rounded bg-blue-600/95 text-white text-[10px]"
                                  title="Move up"
                                >
                                  <FontAwesomeIcon icon={faArrowUp} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveImage(product.id, image, 1)
                                  }
                                  className="h-6 rounded bg-blue-600/95 text-white text-[10px]"
                                  title="Move down"
                                >
                                  <FontAwesomeIcon icon={faArrowDown} />
                                </button>
                              </div>
                            </div>
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

      {variantEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#5E2B16]">
                  {variantEditorModal.mode === "add"
                    ? "Add Variant"
                    : "Edit Variant"}
                </h2>
                <p className="text-xs text-gray-600">
                  Keep sellable stock clear: stock minus reserved minus buffer.
                </p>
              </div>
              <button
                type="button"
                onClick={closeVariantEditorModal}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                aria-label="Close variant editor"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold text-gray-600">
                <span>Variant name</span>
                <input
                  type="text"
                  value={variantEditorForm.variantName}
                  onChange={(e) =>
                    updateVariantEditorField("variantName", e.target.value)
                  }
                  placeholder="100ml"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-normal focus:border-[#9E6E5B] focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-gray-600">
                <span>SKU</span>
                <input
                  type="text"
                  value={variantEditorForm.sku}
                  onChange={(e) =>
                    updateVariantEditorField("sku", e.target.value)
                  }
                  placeholder="PA-VCW-100ML"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-mono font-normal focus:border-[#9E6E5B] focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-gray-600">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={variantEditorForm.price}
                  onChange={(e) =>
                    updateVariantEditorField("price", e.target.value)
                  }
                  placeholder="₹"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-normal focus:border-[#9E6E5B] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-4 rounded-md bg-[#F8F4EC] p-3">
              <p className="mb-2 text-xs font-semibold text-[#5E2B16]">
                Inventory
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1 text-xs font-semibold text-gray-600">
                  <span>Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={variantEditorForm.stockQuantity}
                    disabled={variantEditorModal.mode === "edit"}
                    onChange={(e) =>
                      updateVariantEditorField("stockQuantity", e.target.value)
                    }
                    placeholder={
                      variantEditorModal.mode === "edit"
                        ? "Use Stock +/-"
                        : "On-hand stock"
                    }
                    className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-normal focus:border-[#9E6E5B] focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {variantEditorModal.mode === "edit" && (
                    <span className="text-[11px] font-normal text-gray-500">
                      Use Stock +/- for audited stock changes.
                    </span>
                  )}
                </label>
                <label className="space-y-1 text-xs font-semibold text-gray-600">
                  <span>Buffer</span>
                  <input
                    type="number"
                    min="0"
                    value={variantEditorForm.bufferStock}
                    onChange={(e) =>
                      updateVariantEditorField("bufferStock", e.target.value)
                    }
                    placeholder="Hidden reserve"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-normal focus:border-[#9E6E5B] focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-gray-600">
                  <span>Low stock threshold</span>
                  <input
                    type="number"
                    min="0"
                    value={variantEditorForm.lowStockThreshold}
                    onChange={(e) =>
                      updateVariantEditorField(
                        "lowStockThreshold",
                        e.target.value,
                      )
                    }
                    placeholder="Alert level"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-normal focus:border-[#9E6E5B] focus:outline-none"
                  />
                </label>
                <div className="rounded border border-dashed border-[#D6C9B6] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-gray-500">
                    Available
                  </p>
                  <p className="text-sm font-bold text-[#5E2B16]">
                    {variantModalAvailable == null
                      ? "Calculated after save"
                      : variantModalAvailable}
                  </p>
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={variantEditorForm.isActive}
                onChange={(e) =>
                  updateVariantEditorField("isActive", e.target.checked)
                }
                className="accent-[#9E6E5B]"
              />
              Active variant
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeVariantEditorModal}
                className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariantEditor}
                className="rounded bg-[#5E2B16] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2010]"
              >
                Save Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {stockAdjustmentModal && stockModalVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#5E2B16]">
                  Adjust Stock
                </h2>
                <p className="text-xs text-gray-600">
                  {stockModalVariant.variantName || "Variant"} · SKU{" "}
                  {stockModalVariant.sku || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStockAdjustmentModal}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                aria-label="Close stock adjustment"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded border border-gray-200 p-3">
                <p className="text-[11px] font-semibold uppercase text-gray-500">
                  Current stock
                </p>
                <p className="text-lg font-bold text-[#5E2B16]">
                  {stockModalStock}
                </p>
              </div>
              <div className="rounded border border-gray-200 p-3">
                <p className="text-[11px] font-semibold uppercase text-gray-500">
                  Reserved
                </p>
                {stockModalReserved > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenReservedDetailKey((prev) =>
                        prev === stockModalVariant.id
                          ? null
                          : stockModalVariant.id,
                      )
                    }
                    className="text-left text-lg font-bold text-[#5E2B16] underline decoration-dotted underline-offset-2"
                  >
                    {stockModalReserved}
                  </button>
                ) : (
                  <p className="text-lg font-bold text-[#5E2B16]">
                    {stockModalReserved}
                  </p>
                )}
              </div>
              <div className="rounded border border-gray-200 p-3">
                <p className="text-[11px] font-semibold uppercase text-gray-500">
                  Buffer
                </p>
                <p className="text-lg font-bold text-[#5E2B16]">
                  {stockModalBuffer}
                </p>
              </div>
              <div className="rounded border border-[#819744] bg-[#F3F7EA] p-3">
                <p className="text-[11px] font-semibold uppercase text-gray-500">
                  Available
                </p>
                <p className="text-lg font-bold text-[#3B7509]">
                  {stockModalAvailable}
                </p>
              </div>
            </div>

            {stockModalReserved > 0 &&
              openReservedDetailKey === stockModalVariant.id && (
                <div className="mb-4 rounded border border-[#E8DFC9] bg-[#FCF8EF] px-3 py-2 text-xs text-[#5E2B16]">
                  <p className="font-semibold">Reservation breakdown</p>
                  <p>Active + Confirmed reservations: {stockModalReserved}</p>
                </div>
              )}

            <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-1">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentMode("adjust")}
                  className={`rounded px-2 py-1.5 font-semibold transition ${
                    stockAdjustmentMode === "adjust"
                      ? "bg-white text-[#5E2B16] shadow-sm"
                      : "text-gray-600 hover:bg-white/70"
                  }`}
                >
                  Adjust By
                </button>
                <button
                  type="button"
                  onClick={() => setStockAdjustmentMode("setCount")}
                  className={`rounded px-2 py-1.5 font-semibold transition ${
                    stockAdjustmentMode === "setCount"
                      ? "bg-white text-[#5E2B16] shadow-sm"
                      : "text-gray-600 hover:bg-white/70"
                  }`}
                >
                  Set Actual Count
                </button>
              </div>
            </div>

            {stockAdjustmentMode === "adjust" ? (
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Adjustment
                <input
                  type="number"
                  value={stockAdjustmentQuantity}
                  onChange={(e) => setStockAdjustmentQuantity(e.target.value)}
                  placeholder="+10 or -3"
                  className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-normal focus:border-[#9E6E5B] focus:outline-none"
                />
              </label>
            ) : (
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Actual Count
                <input
                  type="number"
                  min="0"
                  value={stockActualCount}
                  onChange={(e) => setStockActualCount(e.target.value)}
                  placeholder="Enter physically counted stock"
                  className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-normal focus:border-[#9E6E5B] focus:outline-none"
                />
              </label>
            )}

            {computedStockAdjustment != null && (
              <div className="mb-3 rounded border border-[#DCCCB3] bg-[#F8F4EC] px-3 py-2 text-sm text-[#5E2B16]">
                This will adjust stock by {computedAdjustmentSign}
                {computedStockAdjustment}
              </div>
            )}

            <label className="block text-sm font-semibold text-gray-700">
              Reason
              <textarea
                value={stockAdjustmentReason}
                onChange={(e) => setStockAdjustmentReason(e.target.value)}
                placeholder="Required for audit log"
                rows={3}
                className="mt-1 w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm font-normal focus:border-[#9E6E5B] focus:outline-none"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeStockAdjustmentModal}
                className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustVariantStock}
                disabled={computedStockAdjustment === 0}
                className="rounded bg-[#5E2B16] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2010]"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
