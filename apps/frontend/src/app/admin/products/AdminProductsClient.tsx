"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
  faBoxOpen,
  faEdit,
  faTrash,
  faPlus,
  faSave,
  faStar,
  faTimes,
  faUpload,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
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
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  PageHeader,
  Select,
  SkeletonCard,
  Textarea,
  TextInput,
} from "../_components";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

type Variant = {
  variantName: string;
  sku: string;
  price: string;
  mrp: string;
  stockQuantity: string;
};

const MAX_PRODUCT_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ─── Toast bridge ─────────────────────────────────────────────────────────────
// Standardizes on the shared react-hot-toast (already used on Orders) — a loading
// toast is replaced in place by the success/error toast via a shared id.

function useToastBridge() {
  const toastId = useRef<string | undefined>(undefined);

  const showUpdating = (message: string) => {
    toastId.current = toast.loading(message);
  };
  const showSuccess = (message: string) => {
    toast.success(message, { id: toastId.current });
    toastId.current = undefined;
  };
  const showError = (message: string) => {
    toast.error(message, { id: toastId.current });
    toastId.current = undefined;
  };

  return { showUpdating, showSuccess, showError };
}

// ─── Image Manager ────────────────────────────────────────────────────────────

type ProductImage = {
  id: string;
  imageUrl: string;
  position?: number | null;
  variantId?: string | null;
};

function ImageManager({
  productId,
  images,
  onRefresh,
  showSuccess,
  showError,
  showUpdating,
}: {
  productId: string;
  images: ProductImage[];
  onRefresh: () => Promise<void>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showUpdating: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const addImageMutation = useAddProductImage(productId);
  const deleteImageMutation = useDeleteProductImage();

  const sorted = [...images].sort(
    (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0),
  );

  const handleFileSelect = (candidate: File | null) => {
    if (!candidate) {
      setFile(null);
      return;
    }

    if (!ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(candidate.type)) {
      showError("Only JPG, PNG, WEBP, and AVIF images are supported.");
      setFile(null);
      return;
    }

    if (candidate.size > MAX_PRODUCT_IMAGE_UPLOAD_BYTES) {
      showError("Image must be 8MB or smaller.");
      setFile(null);
      return;
    }

    setFile(candidate);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    showUpdating("Uploading image…");
    try {
      const nextPos =
        sorted.length > 0
          ? Math.max(...sorted.map((img) => Number(img.position ?? 0))) + 1
          : 0;
      await addImageMutation.mutateAsync({ file, position: nextPos });
      showSuccess("Image uploaded!");
      setFile(null);
      setShowUpload(false);
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: ProductImage) => {
    if (!confirm("Delete this image?")) return;
    setBusy(img.id);
    showUpdating("Deleting image…");
    try {
      await deleteImageMutation.mutateAsync({ productId, imageId: img.id });
      await onRefresh();
      showSuccess("Image deleted.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  const handleSwap = async (imgA: ProductImage, imgB: ProductImage) => {
    setBusy(imgA.id);
    showUpdating("Updating order…");
    try {
      const posA = Number(imgA.position ?? 0);
      const posB = Number(imgB.position ?? 0);
      await setProductImagePosition(productId, imgA, posB);
      await setProductImagePosition(productId, imgB, posA);
      await onRefresh();
      showSuccess("Order updated.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Reorder failed");
    } finally {
      setBusy(null);
    }
  };

  const handleSetCover = async (img: ProductImage) => {
    setBusy(img.id);
    showUpdating("Setting cover image…");
    try {
      const currentCover = sorted.find((i) => Number(i.position ?? 0) === 0);
      if (currentCover && currentCover.id !== img.id) {
        const posA = Number(img.position ?? 0);
        await setProductImagePosition(productId, img, 0);
        await setProductImagePosition(productId, currentCover, posA);
      } else {
        await setProductCoverImage(productId, img);
      }
      await onRefresh();
      showSuccess("Cover image updated.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to set cover");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2">
      {/* Upload panel */}
      {showUpload ? (
        <div className="mb-3 flex flex-col items-start gap-3 rounded-[var(--admin-r-md)] border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-4 py-3 sm:flex-row sm:items-center">
          <label className="w-full flex-1">
            <span className="mb-1 block text-[length:var(--admin-text-2xs)] font-medium text-[var(--admin-ink-muted)]">
              Select image file
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              className="w-full text-[length:var(--admin-text-xs)] text-[var(--admin-ink-secondary)]"
            />
          </label>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button size="sm" onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowUpload(false); setFile(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowUpload(true)}
          className="mb-3 w-full border border-dashed border-[var(--admin-primary)] bg-transparent text-[var(--admin-primary)] sm:w-auto"
        >
          <FontAwesomeIcon icon={faUpload} /> Upload Image
        </Button>
      )}

      {/* Image strip — horizontally scrollable on mobile */}
      {sorted.length === 0 ? (
        <p className="text-[length:var(--admin-text-xs)] italic text-[var(--admin-ink-muted)]">
          No images yet — upload one above.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {sorted.map((img, idx) => {
            const isCover = idx === 0;
            const isBusy = busy === img.id;
            const canMoveLeft = idx > 0;
            const canMoveRight = idx < sorted.length - 1;

            return (
              <div
                key={img.id}
                className={`relative flex-none flex flex-col rounded-xl border-2 overflow-hidden bg-white shadow-sm w-[120px] sm:w-32 transition-opacity ${
                  isCover ? "border-amber-400" : "border-gray-200"
                } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Cover badge */}
                {isCover && (
                  <div className="absolute top-1.5 left-1.5 z-10 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow">
                    Cover
                  </div>
                )}
                {/* Position number */}
                <div className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {idx + 1}
                </div>

                {/* Image */}
                <div className="relative w-full h-28 bg-gray-100">
                  <Image
                    src={img.imageUrl}
                    alt={`Product image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-1.5 py-1.5 bg-gray-50 border-t border-gray-100 gap-1">
                  <button
                    type="button"
                    title="Move left"
                    disabled={!canMoveLeft}
                    onClick={() => handleSwap(img, sorted[idx - 1])}
                    className="flex-1 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <button
                    type="button"
                    title={isCover ? "Already cover" : "Set as cover"}
                    disabled={isCover}
                    onClick={() => handleSetCover(img)}
                    className="flex-1 h-8 flex items-center justify-center rounded bg-amber-100 text-amber-600 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition"
                  >
                    <FontAwesomeIcon icon={faStar} />
                  </button>
                  <button
                    type="button"
                    title="Delete image"
                    onClick={() => handleDelete(img)}
                    className="flex-1 h-8 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs transition"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    type="button"
                    title="Move right"
                    disabled={!canMoveRight}
                    onClick={() => handleSwap(img, sorted[idx + 1])}
                    className="flex-1 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    brand: "",
    discountEndsAt: "",
    isActive: true,
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { variantName: "", sku: "", price: "", mrp: "", stockQuantity: "" },
  ]);
  const [contentSectionsByProduct, setContentSectionsByProduct] = useState<
    Record<string, ProductContentSection[]>
  >({});
  const [loadingContentFor, setLoadingContentFor] = useState<string | null>(null);
  const { showSuccess, showError, showUpdating } = useToastBridge();

  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-[#5E2B16] animate-pulse text-sm">Checking access…</div>
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
      { variantName: "", sku: "", price: "", mrp: "", stockQuantity: "" },
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
      discountEndsAt: toDateTimeLocal(product.discountEndsAt),
      isActive: product.isActive,
    });
    setAutoSlug(false);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", brand: "", discountEndsAt: "", isActive: true });
    setAutoSlug(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    showUpdating("Creating product…");
    try {
      const validVariants = variants
        .filter((v) => v.variantName || v.sku || v.price || v.mrp)
        .map((v) => ({
          variantName: v.variantName || undefined,
          sku: v.sku || undefined,
          price: v.price ? Number(v.price) : undefined,
          mrp: v.mrp ? Number(v.mrp) : undefined,
          stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : undefined,
        }));

      const created = await createProduct.mutateAsync({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        brand: form.brand || undefined,
        discountEndsAt: fromDateTimeLocal(form.discountEndsAt),
        isActive: form.isActive,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        variants: validVariants.length > 0 ? validVariants : undefined,
      });

      showSuccess(`Product "${created.name}" created!`);
      setForm({ name: "", slug: "", description: "", brand: "", discountEndsAt: "", isActive: true });
      setSelectedCategoryIds([]);
      setVariants([{ variantName: "", sku: "", price: "", mrp: "", stockQuantity: "" }]);
      setAutoSlug(true);
      setShowCreateForm(false);
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to create product");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    showUpdating("Saving changes…");
    try {
      await updateProduct.mutateAsync({
        id: editingId,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        brand: form.brand || undefined,
        discountEndsAt: fromDateTimeLocal(form.discountEndsAt) ?? null,
        isActive: form.isActive,
      });
      showSuccess("Product updated!");
      cancelEdit();
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to update product");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    showUpdating("Deleting product…");
    try {
      await deleteProduct.mutateAsync(id);
      showSuccess(`"${name}" deleted.`);
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to delete product");
    }
  };

  const handleAssignCategoryToProduct = async (productId: string, categoryId: string) => {
    if (!categoryId) return;
    showUpdating("Assigning category…");
    try {
      await assignProductCategories(productId, [categoryId]);
      await refreshProducts();
      showSuccess("Category assigned.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to assign category");
    }
  };

  const handleRemoveCategoryFromProduct = async (productId: string, categoryId: string) => {
    showUpdating("Removing category…");
    try {
      await removeProductCategory(productId, categoryId);
      await refreshProducts();
      showSuccess("Category removed.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to remove category");
    }
  };

  const handleAddVariantToProduct = async (productId: string) => {
    const variantName = window.prompt("Variant name");
    if (!variantName) return;
    const sku = window.prompt("SKU (optional)") || undefined;
    const priceInput = window.prompt("Price (optional)") || "";
    const mrpInput = window.prompt("MRP (optional)") || "";
    const stockInput = window.prompt("Stock quantity (optional)") || "";
    showUpdating("Adding variant…");
    try {
      await addProductVariant(productId, {
        variantName,
        sku,
        price: priceInput ? Number(priceInput) : undefined,
        mrp: mrpInput ? Number(mrpInput) : undefined,
        stockQuantity: stockInput ? Number(stockInput) : undefined,
      });
      await refreshProducts();
      showSuccess("Variant added.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to add variant");
    }
  };

  const handleEditVariant = async (productId: string, variant: ProductVariant) => {
    const variantName = window.prompt("Variant name", variant.variantName ?? "") ?? undefined;
    const sku = window.prompt("SKU", variant.sku ?? "") ?? undefined;
    const priceInput = window.prompt("Price", String(variant.price ?? "")) ?? "";
    const mrpInput = window.prompt("MRP", String(variant.mrp ?? "")) ?? "";
    const stockInput = window.prompt("Stock quantity", String(variant.stockQuantity ?? "")) ?? "";
    const activeInput = window.prompt("Is active? (yes/no)", variant.isActive ? "yes" : "no") ?? "yes";
    showUpdating("Updating variant…");
    try {
      await updateProductVariant(productId, variant.id, {
        variantName,
        sku,
        price: priceInput ? Number(priceInput) : undefined,
        mrp: mrpInput ? Number(mrpInput) : undefined,
        stockQuantity: stockInput ? Number(stockInput) : undefined,
        isActive: activeInput.toLowerCase() !== "no",
      });
      await refreshProducts();
      showSuccess("Variant updated.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to update variant");
    }
  };

  const handleDeleteVariant = async (productId: string, variantId: string) => {
    if (!confirm("Delete this variant?")) return;
    showUpdating("Deleting variant…");
    try {
      await deleteProductVariant(productId, variantId);
      await refreshProducts();
      showSuccess("Variant deleted.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to delete variant");
    }
  };

  const handleAdjustVariantStock = async (productId: string, variantId: string) => {
    const quantityInput = window.prompt("Stock adjustment quantity (e.g. 10 or -3)");
    if (!quantityInput) return;
    const reason = window.prompt("Reason (optional)") || undefined;
    showUpdating("Adjusting stock…");
    try {
      await adjustProductVariantStock(productId, variantId, {
        quantity: Number(quantityInput),
        reason,
      });
      await refreshProducts();
      showSuccess("Stock adjusted.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to adjust stock");
    }
  };

  const handleLoadContentSections = async (productId: string) => {
    try {
      setLoadingContentFor(productId);
      const sections = await listProductContentSectionsAdmin(productId);
      setContentSectionsByProduct((prev) => ({ ...prev, [productId]: sections }));
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to load content sections");
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
    if (contentText.trim().startsWith("{") || contentText.trim().startsWith("[")) {
      try { parsedContent = JSON.parse(contentText); } catch {
        showError("Invalid JSON content"); return;
      }
    }
    showUpdating("Creating section…");
    try {
      await createProductContentSection(productId, {
        sectionType, title, content: parsedContent, position: Number(positionInput),
      });
      await handleLoadContentSections(productId);
      showSuccess("Content section created.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to create content section");
    }
  };

  const handleEditContentSection = async (productId: string, section: ProductContentSection) => {
    const sectionId = section.id;
    if (!sectionId) return;
    const title = window.prompt("Title", section.title ?? "") ?? section.title ?? undefined;
    const positionInput = window.prompt("Position", String(section.position ?? 0)) ?? String(section.position ?? 0);
    const contentInput = window.prompt("Content (JSON or plain text)", JSON.stringify(section.content)) ?? JSON.stringify(section.content);

    let parsedContent: unknown = contentInput;
    try { parsedContent = JSON.parse(contentInput); } catch { /* keep plain text */ }

    showUpdating("Updating section…");
    try {
      await updateProductContentSection(productId, sectionId, {
        title: title || undefined, position: Number(positionInput), content: parsedContent,
      });
      await handleLoadContentSections(productId);
      showSuccess("Content section updated.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to update content section");
    }
  };

  const handleDeleteContentSection = async (productId: string, sectionId?: string) => {
    if (!sectionId) return;
    if (!confirm("Delete this content section?")) return;
    showUpdating("Deleting section…");
    try {
      await deleteProductContentSection(productId, sectionId);
      await handleLoadContentSections(productId);
      showSuccess("Content section removed.");
    } catch (err) {
      showError((err instanceof Error ? err.message : undefined) ?? "Failed to remove content section");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Manage Products"
        breadcrumb="Admin / Products"
        actions={
          <Button
            size="sm"
            variant={showCreateForm ? "secondary" : "primary"}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingId(null);
              setForm({ name: "", slug: "", description: "", brand: "", discountEndsAt: "", isActive: true });
              setSelectedCategoryIds([]);
              setVariants([{ variantName: "", sku: "", price: "", mrp: "", stockQuantity: "" }]);
              setAutoSlug(true);
            }}
          >
            <FontAwesomeIcon icon={showCreateForm ? faTimes : faPlus} />
            <span className="hidden sm:inline">{showCreateForm ? "Cancel" : "New Product"}</span>
          </Button>
        }
      />

          {/* ─── CREATE FORM ─────────────────────────────────────────────── */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 shadow-[var(--admin-elev-1)] sm:p-6"
            >
              <h3 className="mb-4 text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">
                Create New Product
              </h3>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="prod-name" required>
                  <TextInput
                    id="prod-name"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Vitamin C Face Wash"
                  />
                </Field>
                <Field label="Slug" htmlFor="prod-slug" help="Auto-generated from name unless edited">
                  <TextInput
                    id="prod-slug"
                    value={form.slug}
                    onChange={(e) => { setAutoSlug(false); setForm((p) => ({ ...p, slug: e.target.value })); }}
                    placeholder="auto-generated"
                    className="font-mono"
                  />
                </Field>
                <Field label="Brand" htmlFor="prod-brand">
                  <TextInput
                    id="prod-brand"
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. Pureastra"
                  />
                </Field>
                <Field label="Discount Ends At" htmlFor="prod-discount">
                  <TextInput
                    id="prod-discount"
                    type="datetime-local"
                    value={form.discountEndsAt}
                    onChange={(e) => setForm((p) => ({ ...p, discountEndsAt: e.target.value }))}
                  />
                </Field>
                <div className="flex items-center gap-3 sm:pt-6">
                  <Checkbox
                    id="isActive"
                    label="Active (visible on site)"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Field label="Description" htmlFor="prod-desc">
                  <Textarea
                    id="prod-desc"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Product description"
                  />
                </Field>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[length:var(--admin-text-sm)] font-medium text-[var(--admin-ink-secondary)]">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded-full px-3 py-1.5 text-[length:var(--admin-text-xs)] font-medium transition-colors duration-[var(--admin-duration-frequent)] ${
                        selectedCategoryIds.includes(cat.id)
                          ? "bg-[var(--admin-primary)] text-white"
                          : "bg-[var(--admin-surface-alt)] text-[var(--admin-ink-secondary)] hover:bg-[var(--admin-border)]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants — stack on mobile */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[length:var(--admin-text-sm)] font-medium text-[var(--admin-ink-secondary)]">
                    Variants (optional)
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
                    <FontAwesomeIcon icon={faPlus} /> Add
                  </Button>
                </div>
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-2 rounded-[var(--admin-r-md)] border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-2 sm:grid-cols-4"
                    >
                      <TextInput
                        placeholder="Name (e.g. 100ml)"
                        value={v.variantName}
                        onChange={(e) => updateVariant(i, "variantName", e.target.value)}
                        className="col-span-2 h-8 bg-[var(--admin-card-bg)] text-[length:var(--admin-text-xs)] sm:col-span-1"
                      />
                      <TextInput
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        className="h-8 bg-[var(--admin-card-bg)] font-mono text-[length:var(--admin-text-xs)]"
                      />
                      <TextInput
                        type="number"
                        placeholder="Price (₹)"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        className="h-8 bg-[var(--admin-card-bg)] text-[length:var(--admin-text-xs)]"
                      />
                      <TextInput
                        type="number"
                        placeholder="MRP (₹)"
                        value={v.mrp}
                        onChange={(e) => updateVariant(i, "mrp", e.target.value)}
                        className="h-8 bg-[var(--admin-card-bg)] text-[length:var(--admin-text-xs)]"
                      />
                      <div className="flex gap-2">
                        <TextInput
                          type="number"
                          placeholder="Stock"
                          value={v.stockQuantity}
                          onChange={(e) => updateVariant(i, "stockQuantity", e.target.value)}
                          className="h-8 flex-1 bg-[var(--admin-card-bg)] text-[length:var(--admin-text-xs)]"
                        />
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="px-1 text-[var(--admin-error-fg)] hover:brightness-90"
                          >
                            <FontAwesomeIcon icon={faTrash} size="xs" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={createProduct.isPending} loading={createProduct.isPending}>
                  {createProduct.isPending ? "Creating…" : "Create Product"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ─── PRODUCT LIST ────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:gap-6">
            {productsLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : products.length === 0 ? (
              <EmptyState
                icon={faBoxOpen}
                heading="No products yet"
                message="Create your first product using the button above."
              />
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
                >
                  {/* Product header row */}
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      {editingId === product.id ? (
                        /* ── Edit form ── */
                        <div className="space-y-3">
                          <TextInput
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="font-semibold"
                          />
                          <TextInput
                            value={form.slug}
                            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                            className="font-mono"
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextInput
                              value={form.brand || ""}
                              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                              placeholder="Brand"
                            />
                            <TextInput
                              type="datetime-local"
                              value={form.discountEndsAt}
                              onChange={(e) => setForm((p) => ({ ...p, discountEndsAt: e.target.value }))}
                            />
                            <Checkbox
                              id={`active-${product.id}`}
                              label="Active"
                              checked={form.isActive}
                              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                            />
                          </div>
                          <Textarea
                            value={form.description || ""}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={updateProduct.isPending} loading={updateProduct.isPending}>
                              <FontAwesomeIcon icon={faSave} />
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display view ── */
                        <>
                          <h3 className="truncate text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">
                            {product.name}
                          </h3>
                          <p className="truncate font-mono text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                            {product.slug}
                          </p>
                          {product.brand && (
                            <p className="mt-0.5 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                              Brand: {product.brand}
                            </p>
                          )}
                          {product.discountEndsAt && (
                            <p className="mt-0.5 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                              Discount ends: {new Date(product.discountEndsAt).toLocaleString()}
                            </p>
                          )}
                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-[length:var(--admin-text-sm)] text-[var(--admin-ink-secondary)]">
                              {product.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge role={product.isActive ? "success" : "neutral"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {product.categories?.map((pc) => (
                              <button
                                key={pc.category.id}
                                type="button"
                                onClick={() => handleRemoveCategoryFromProduct(product.id, pc.category.id)}
                                title="Tap to remove"
                                className="rounded-full bg-[var(--admin-info-bg)] px-2 py-0.5 text-[length:var(--admin-text-xs)] text-[var(--admin-info-fg)] transition-colors duration-[var(--admin-duration-frequent)] hover:brightness-95"
                              >
                                {pc.category.name} ×
                              </button>
                            ))}
                          </div>
                          <div className="mt-2">
                            <Select
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                void handleAssignCategoryToProduct(product.id, e.target.value);
                                e.currentTarget.value = "";
                              }}
                              className="h-8 w-full text-[length:var(--admin-text-xs)] sm:w-48"
                            >
                              <option value="">Assign category…</option>
                              {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </Select>
                          </div>
                        </>
                      )}
                    </div>

                    {editingId !== product.id && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-none">
                        <button
                          onClick={() => startEdit(product)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Edit product"
                        >
                          <FontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleteProduct.isPending}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                          title="Delete product"
                        >
                          <FontAwesomeIcon icon={faTrash} size="sm" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Variants ── */}
                  <div className="mb-3 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Variants</p>
                      <button
                        type="button"
                        onClick={() => handleAddVariantToProduct(product.id)}
                        className="text-xs text-[#9E6E5B] hover:text-[#7a5644] font-medium"
                      >
                        + Add
                      </button>
                    </div>
                    {product.variants && product.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="bg-gray-50 px-3 py-2 rounded-lg text-xs border border-gray-200 min-w-[120px]"
                          >
                            <div className="font-semibold text-gray-800">{variant.variantName || "Variant"}</div>
                            <div className="text-gray-500 text-[11px]">SKU: {variant.sku || "—"}</div>
                            <div className="text-gray-700 font-medium">₹{variant.price ?? "—"}</div>
                            <div className="text-gray-500 text-[11px]">MRP: {variant.mrp ?? "—"}</div>
                            <div className="text-gray-400 text-[11px]">Stock: {variant.stockQuantity ?? "—"}</div>
                            <div className="mt-1.5 flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditVariant(product.id, variant as ProductVariant)}
                                className="flex-1 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition text-[11px] font-medium"
                              >Edit</button>
                              <button
                                type="button"
                                onClick={() => handleAdjustVariantStock(product.id, variant.id)}
                                className="flex-1 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition text-[11px] font-medium"
                              >Stk±</button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVariant(product.id, variant.id)}
                                className="flex-1 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition text-[11px] font-medium"
                              >Del</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No variants yet</p>
                    )}
                  </div>

                  {/* ── Content Sections ── */}
                  <div className="mb-3 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content Sections</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleLoadContentSections(product.id)}
                          className="text-xs text-[#5B8D7C] font-medium"
                        >
                          {loadingContentFor === product.id ? "Loading…" : "Load"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateContentSection(product.id)}
                          className="text-xs text-[#9E6E5B] font-medium"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                    {(contentSectionsByProduct[product.id] ?? []).length > 0 ? (
                      <div className="space-y-2">
                        {contentSectionsByProduct[product.id].map((section) => (
                          <div
                            key={section.id ?? `${section.sectionType}-${section.position}`}
                            className="text-xs border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#5E2B16]">{section.sectionType}</span>
                              <span className="text-gray-400 ml-1">pos {section.position}</span>
                              {section.title && <span className="block text-gray-500 truncate">{section.title}</span>}
                            </div>
                            <div className="flex gap-1 flex-none">
                              <button
                                type="button"
                                onClick={() => handleEditContentSection(product.id, section)}
                                className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                              >Edit</button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContentSection(product.id, section.id)}
                                className="px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
                              >Del</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No content sections loaded</p>
                    )}
                  </div>

                  {/* ── Images ── */}
                  <div className="rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] p-3">
                    <p className="mb-1 text-[length:var(--admin-text-2xs)] font-semibold uppercase tracking-wide text-[var(--admin-ink-muted)]">
                      Images
                    </p>
                    <p className="mb-2 text-[length:var(--admin-text-2xs)] text-[var(--admin-ink-muted)]">
                      #1 = cover · tap ← → to reorder
                    </p>
                    <ImageManager
                      productId={product.id}
                      images={product.images ?? []}
                      onRefresh={refreshProducts}
                      showSuccess={showSuccess}
                      showError={showError}
                      showUpdating={showUpdating}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
    </div>
  );
}
