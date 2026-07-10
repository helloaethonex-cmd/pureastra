"use client";

import { useState, useEffect } from "react";
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
  faCircleNotch,
  faCheckCircle,
  faExclamationCircle,
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

// ─── Toast System ─────────────────────────────────────────────────────────────

type ToastState = {
  type: "idle" | "updating" | "success" | "error";
  message?: string;
};

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const visible = toast.type !== "idle";

  useEffect(() => {
    if (toast.type === "success" || toast.type === "error") {
      const t = setTimeout(onDismiss, 3500);
      return () => clearTimeout(t);
    }
  }, [toast, onDismiss]);

  if (!visible) return null;

  const cfg = {
    updating: {
      bg: "bg-[#5E2B16]",
      icon: faCircleNotch,
      spin: true,
      text: "text-white",
    },
    success: {
      bg: "bg-[#4a7c43]",
      icon: faCheckCircle,
      spin: false,
      text: "text-white",
    },
    error: {
      bg: "bg-red-600",
      icon: faExclamationCircle,
      spin: false,
      text: "text-white",
    },
    idle: { bg: "", icon: faCheckCircle, spin: false, text: "" },
  }[toast.type];

  return (
    <div
      className={`fixed bottom-5 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${cfg.bg} ${cfg.text}
        text-sm font-medium max-w-xs sm:max-w-sm
        animate-[slideUp_0.25s_ease-out]`}
      style={{ animation: "slideUp 0.25s ease-out" }}
    >
      <FontAwesomeIcon
        icon={cfg.icon}
        className={cfg.spin ? "animate-spin" : ""}
        size="sm"
      />
      <span className="flex-1">{toast.message ?? ""}</span>
      {toast.type !== "updating" && (
        <button
          onClick={onDismiss}
          className="opacity-70 hover:opacity-100 transition ml-1"
          aria-label="Dismiss"
        >
          <FontAwesomeIcon icon={faTimes} size="xs" />
        </button>
      )}
    </div>
  );
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
  onToast,
}: {
  productId: string;
  images: ProductImage[];
  onRefresh: () => Promise<void>;
  onToast: (t: ToastState) => void;
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
      onToast({
        type: "error",
        message: "Only JPG, PNG, WEBP, and AVIF images are supported.",
      });
      setFile(null);
      return;
    }

    if (candidate.size > MAX_PRODUCT_IMAGE_UPLOAD_BYTES) {
      onToast({
        type: "error",
        message: "Image must be 8MB or smaller.",
      });
      setFile(null);
      return;
    }

    setFile(candidate);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    onToast({ type: "updating", message: "Uploading image…" });
    try {
      const nextPos =
        sorted.length > 0
          ? Math.max(...sorted.map((img) => Number(img.position ?? 0))) + 1
          : 0;
      await addImageMutation.mutateAsync({ file, position: nextPos });
      onToast({ type: "success", message: "Image uploaded!" });
      setFile(null);
      setShowUpload(false);
    } catch (err) {
      onToast({ type: "error", message: (err instanceof Error ? err.message : undefined) ?? "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: ProductImage) => {
    if (!confirm("Delete this image?")) return;
    setBusy(img.id);
    onToast({ type: "updating", message: "Deleting image…" });
    try {
      await deleteImageMutation.mutateAsync({ productId, imageId: img.id });
      await onRefresh();
      onToast({ type: "success", message: "Image deleted." });
    } catch (err) {
      onToast({ type: "error", message: (err instanceof Error ? err.message : undefined) ?? "Delete failed" });
    } finally {
      setBusy(null);
    }
  };

  const handleSwap = async (imgA: ProductImage, imgB: ProductImage) => {
    setBusy(imgA.id);
    onToast({ type: "updating", message: "Updating order…" });
    try {
      const posA = Number(imgA.position ?? 0);
      const posB = Number(imgB.position ?? 0);
      await setProductImagePosition(productId, imgA, posB);
      await setProductImagePosition(productId, imgB, posA);
      await onRefresh();
      onToast({ type: "success", message: "Order updated." });
    } catch (err) {
      onToast({ type: "error", message: (err instanceof Error ? err.message : undefined) ?? "Reorder failed" });
    } finally {
      setBusy(null);
    }
  };

  const handleSetCover = async (img: ProductImage) => {
    setBusy(img.id);
    onToast({ type: "updating", message: "Setting cover image…" });
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
      onToast({ type: "success", message: "Cover image updated." });
    } catch (err) {
      onToast({ type: "error", message: (err instanceof Error ? err.message : undefined) ?? "Failed to set cover" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2">
      {/* Upload panel */}
      {showUpload ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
          <label className="flex-1 w-full">
            <span className="block text-xs text-blue-700 font-medium mb-1">
              Select image file
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              className="text-xs text-gray-700 w-full"
            />
          </label>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
            >
              <FontAwesomeIcon icon={uploading ? faCircleNotch : faUpload} className={uploading ? "animate-spin" : ""} />
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              onClick={() => { setShowUpload(false); setFile(null); }}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowUpload(true)}
          className="mb-3 w-full sm:w-auto px-4 py-2.5 border border-dashed border-[#9E6E5B] text-[#9E6E5B] hover:bg-[#fdf6f0] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
        >
          <FontAwesomeIcon icon={faUpload} /> Upload Image
        </button>
      )}

      {/* Image strip — horizontally scrollable on mobile */}
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
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
  const [toast, setToast] = useState<ToastState>({ type: "idle" });
  const [contentSectionsByProduct, setContentSectionsByProduct] = useState<
    Record<string, ProductContentSection[]>
  >({});
  const [loadingContentFor, setLoadingContentFor] = useState<string | null>(null);

  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const pushToast = (t: ToastState) => setToast(t);
  const dismissToast = () => setToast({ type: "idle" });

  const showSuccess = (msg: string) => pushToast({ type: "success", message: msg });
  const showError = (msg: string) => pushToast({ type: "error", message: msg });
  const showUpdating = (msg: string) => pushToast({ type: "updating", message: msg });

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
    <>
      {/* Global toast — fixed, always on top */}
      <Toast toast={toast} onDismiss={dismissToast} />

      <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex-none rounded-full bg-[#9E6E5B] flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#5E2B16] truncate">
                Manage Products
              </h1>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingId(null);
                setForm({ name: "", slug: "", description: "", brand: "", discountEndsAt: "", isActive: true });
                setSelectedCategoryIds([]);
                setVariants([{ variantName: "", sku: "", price: "", mrp: "", stockQuantity: "" }]);
                setAutoSlug(true);
              }}
              className="flex-none px-3 sm:px-4 py-2 bg-[#9E6E5B] hover:bg-[#8a5e4e] text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
            >
              <FontAwesomeIcon icon={showCreateForm ? faTimes : faPlus} />
              <span className="hidden sm:inline">{showCreateForm ? "Cancel" : "New Product"}</span>
            </button>
          </div>

          {/* ─── CREATE FORM ─────────────────────────────────────────────── */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6"
            >
              <h3 className="text-base sm:text-lg font-semibold text-[#5E2B16] mb-4">
                Create New Product
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9E6E5B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5E2B16] mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setAutoSlug(false); setForm((p) => ({ ...p, slug: e.target.value })); }}
                    placeholder="auto-generated"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9E6E5B] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5E2B16] mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. Pureastra"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9E6E5B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5E2B16] mb-1">Discount Ends At</label>
                  <input
                    type="datetime-local"
                    value={form.discountEndsAt}
                    onChange={(e) => setForm((p) => ({ ...p, discountEndsAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9E6E5B]"
                  />
                </div>
                <div className="flex items-center gap-3 sm:pt-6">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="accent-[#9E6E5B] w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-[#5E2B16]">
                    Active (visible on site)
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5E2B16] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Product description"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9E6E5B] resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5E2B16] mb-2">Categories</label>
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

              {/* Variants — stack on mobile */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#5E2B16]">Variants (optional)</label>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs text-[#9E6E5B] hover:text-[#7a5644] flex items-center gap-1 font-medium"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <input
                        type="text"
                        placeholder="Name (e.g. 100ml)"
                        value={v.variantName}
                        onChange={(e) => updateVariant(i, "variantName", e.target.value)}
                        className="col-span-2 sm:col-span-1 border border-gray-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] bg-white"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        className="border border-gray-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] font-mono bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        className="border border-gray-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] bg-white"
                      />
                      <input
                        type="number"
                        placeholder="MRP (₹)"
                        value={v.mrp}
                        onChange={(e) => updateVariant(i, "mrp", e.target.value)}
                        className="border border-gray-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] bg-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Stock"
                          value={v.stockQuantity}
                          onChange={(e) => updateVariant(i, "stockQuantity", e.target.value)}
                          className="flex-1 border border-gray-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#9E6E5B] bg-white"
                        />
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="text-red-500 hover:text-red-700 px-1"
                          >
                            <FontAwesomeIcon icon={faTrash} size="xs" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="px-4 py-2.5 bg-[#9E6E5B] hover:bg-[#8a5e4e] text-white rounded-lg transition disabled:opacity-60 text-sm font-medium flex items-center gap-2"
                >
                  {createProduct.isPending && <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" size="sm" />}
                  {createProduct.isPending ? "Creating…" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* ─── PRODUCT LIST ────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:gap-6">
            {productsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
                Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No products yet. Create your first one!
              </div>
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
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-semibold"
                          />
                          <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={form.brand || ""}
                              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                              placeholder="Brand"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                            />
                            <input
                              type="datetime-local"
                              value={form.discountEndsAt}
                              onChange={(e) => setForm((p) => ({ ...p, discountEndsAt: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                            />
                            <label className="flex items-center gap-2 sm:pt-0">
                              <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                className="accent-[#9E6E5B] w-4 h-4"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                          </div>
                          <textarea
                            value={form.description || ""}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description"
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdate}
                              disabled={updateProduct.isPending}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {updateProduct.isPending
                                ? <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" size="sm" />
                                : <FontAwesomeIcon icon={faSave} size="sm" />}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display view ── */
                        <>
                          <h3 className="text-base sm:text-lg font-semibold text-[#5E2B16] truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono truncate">{product.slug}</p>
                          {product.brand && (
                            <p className="text-xs text-gray-500 mt-0.5">Brand: {product.brand}</p>
                          )}
                          {product.discountEndsAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Discount ends: {new Date(product.discountEndsAt).toLocaleString()}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                            {product.categories?.map((pc) => (
                              <button
                                key={pc.category.id}
                                type="button"
                                onClick={() => handleRemoveCategoryFromProduct(product.id, pc.category.id)}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition"
                                title="Tap to remove"
                              >
                                {pc.category.name} ×
                              </button>
                            ))}
                          </div>
                          <div className="mt-2">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                void handleAssignCategoryToProduct(product.id, e.target.value);
                                e.currentTarget.value = "";
                              }}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white w-full sm:w-48"
                            >
                              <option value="">Assign category…</option>
                              {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
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
                  <div className="border border-gray-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Images
                    </p>
                    <p className="text-[11px] text-gray-400 mb-2">
                      #1 = cover · tap ← → to reorder
                    </p>
                    <ImageManager
                      productId={product.id}
                      images={product.images ?? []}
                      onRefresh={refreshProducts}
                      onToast={pushToast}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Keyframe for toast slide-up */}
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
    </>
  );
}
