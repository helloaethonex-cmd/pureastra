import {
  findAllProducts,
  findProductById,
  findProductBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
  assignCategoriesToProduct,
  removeCategoryFromProduct,
  findVariantById,
  createVariant,
  updateVariant,
  softDeleteVariant,
  adjustVariantStock,
  addProductImage,
  deleteProductImage,
  findProductImageById,
  listProductContentSections,
  createProductContentSection,
  updateProductContentSection,
  deactivateProductContentSection,
  findProductContentSectionById,
  findAllCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from "./products.repository";
import {
  buildProductDetailCacheKey,
  deleteCachedKey,
  getCachedJson,
  setCachedJson,
} from "../../lib/cache/product-detail.cache";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductQuery,
  AddProductImageInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  StockAdjustmentInput,
  CreateProductContentSectionInput,
  UpdateProductContentSectionInput,
} from "./products.types";
import { AppError } from "../../lib/errors/app-error";
import { deleteObjectFromR2 } from "../../lib/r2";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

const PRODUCT_DETAIL_CACHE_TTL_SECONDS = 60;

const cacheKeyById = (id: string) => buildProductDetailCacheKey(`id:${id}`);
const cacheKeyBySlug = (slug: string) => buildProductDetailCacheKey(`slug:${slug}`);

const invalidateProductDetailCache = async (id: string, slug?: string | null) => {
  const keys = [cacheKeyById(id), ...(slug ? [cacheKeyBySlug(slug)] : [])];
  await Promise.all(keys.map((key) => deleteCachedKey(key)));
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = async (query: ProductQuery) => {
  return findAllProducts(query);
};

export const getProductById = async (id: string) => {
  const cached = await getCachedJson<any>(cacheKeyById(id));
  if (cached) return cached;

  const product = await findProductById(BigInt(id));
  if (!product) throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");

  await Promise.all([
    setCachedJson(cacheKeyById(id), product, PRODUCT_DETAIL_CACHE_TTL_SECONDS),
    ...(product.slug
      ? [setCachedJson(cacheKeyBySlug(product.slug), product, PRODUCT_DETAIL_CACHE_TTL_SECONDS)]
      : []),
  ]);

  return product;
};

export const getProductBySlug = async (slug: string) => {
  const cached = await getCachedJson<any>(cacheKeyBySlug(slug));
  if (cached) return cached;

  const product = await findProductBySlug(slug);
  if (!product) throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");

  await Promise.all([
    setCachedJson(cacheKeyBySlug(slug), product, PRODUCT_DETAIL_CACHE_TTL_SECONDS),
    setCachedJson(cacheKeyById(product.id.toString()), product, PRODUCT_DETAIL_CACHE_TTL_SECONDS),
  ]);

  return product;
};

export const createNewProduct = async (data: CreateProductInput) => {
  const created = await createProduct(data);
  await invalidateProductDetailCache(created.id.toString(), created.slug);
  return created;
};

export const updateExistingProduct = async (id: string, data: UpdateProductInput) => {
  const existing = await getProductById(id); // ensure exists
  const updated = await updateProduct(BigInt(id), data);
  await Promise.all([
    invalidateProductDetailCache(id, existing.slug),
    invalidateProductDetailCache(id, updated.slug),
  ]);
  return updated;
};

export const deleteProduct = async (id: string) => {
  const existing = await getProductById(id); // ensure exists
  const deleted = await softDeleteProduct(BigInt(id));
  await invalidateProductDetailCache(id, existing.slug);
  return deleted;
};

// ─── Product Categories ───────────────────────────────────────────────────────

export const assignCategories = async (productId: string, categoryIds: bigint[]) => {
  const product = await getProductById(productId);
  const result = await assignCategoriesToProduct(BigInt(productId), categoryIds);
  await invalidateProductDetailCache(productId, product.slug);
  return result;
};

export const removeCategory = async (productId: string, categoryId: string) => {
  const product = await getProductById(productId);
  const result = await removeCategoryFromProduct(BigInt(productId), BigInt(categoryId));
  await invalidateProductDetailCache(productId, product.slug);
  return result;
};

// ─── Product Variants ─────────────────────────────────────────────────────────

export const getVariantById = async (id: string) => {
  const variant = await findVariantById(BigInt(id));
  if (!variant) throw new AppError(404, "Variant not found", "VARIANT_NOT_FOUND");
  return variant;
};

const getScopedVariantById = async (productId: string, variantId: string) => {
  const variant = await getVariantById(variantId);
  if (variant.productId.toString() !== productId) {
    throw new AppError(404, "Variant not found", "VARIANT_NOT_FOUND");
  }
  return variant;
};

export const addVariantToProduct = async (productId: string, data: CreateVariantInput) => {
  const product = await getProductById(productId);
  const created = await createVariant(BigInt(productId), data);
  await invalidateProductDetailCache(productId, product.slug);
  return created;
};

export const updateProductVariant = async (variantId: string, data: UpdateVariantInput) => {
  const existing = await getVariantById(variantId);
  const updated = await updateVariant(BigInt(variantId), data);
  await invalidateProductDetailCache(existing.productId.toString(), existing.product?.slug);
  return updated;
};

export const deleteProductVariant = async (variantId: string) => {
  const existing = await getVariantById(variantId);
  const deleted = await softDeleteVariant(BigInt(variantId));
  await invalidateProductDetailCache(existing.productId.toString(), existing.product?.slug);
  return deleted;
};

export const adjustStock = async (variantId: string, data: StockAdjustmentInput) => {
  const existing = await getVariantById(variantId);
  const updated = await adjustVariantStock(BigInt(variantId), data);
  await invalidateProductDetailCache(existing.productId.toString(), existing.product?.slug);
  return updated;
};

// ─── Product Images ───────────────────────────────────────────────────────────

export const addImageToProduct = async (productId: string, data: AddProductImageInput) => {
  const product = await getProductById(productId);
  const image = await addProductImage(BigInt(productId), data);
  await invalidateProductDetailCache(productId, product.slug);
  return image;
};

// ─── Product Content Sections ────────────────────────────────────────────────

export const getProductContentSections = async (productId: string, includeInactive = false) => {
  await getProductById(productId);
  return listProductContentSections(BigInt(productId), includeInactive);
};

export const getPublicProductContentSections = async (productId: string) => {
  const sections = await getProductContentSections(productId, false);
  return sections.map((section: any) => ({
    sectionType: section.sectionType,
    title: section.title,
    content: section.content,
    position: section.position,
  }));
};

export const getAdminProductContentSections = async (productId: string) => {
  return getProductContentSections(productId, true);
};

export const addProductContentSection = async (productId: string, data: CreateProductContentSectionInput) => {
  const product = await getProductById(productId);
  try {
    const created = await createProductContentSection(BigInt(productId), data);
    await invalidateProductDetailCache(productId, product.slug);
    return created;
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new AppError(409, "Content section with this sectionType and position already exists for this product", "CONTENT_SECTION_CONFLICT");
    }
    throw err;
  }
};

export const editProductContentSection = async (
  productId: string,
  sectionId: string,
  data: UpdateProductContentSectionInput,
) => {
  const product = await getProductById(productId);
  const section = await findProductContentSectionById(BigInt(sectionId));

  if (!section || section.productId.toString() !== productId) {
    throw new AppError(404, "Product content section not found", "CONTENT_SECTION_NOT_FOUND");
  }

  try {
    const updated = await updateProductContentSection(BigInt(sectionId), data);
    await invalidateProductDetailCache(productId, product.slug);
    return updated;
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new AppError(409, "Content section with this sectionType and position already exists for this product", "CONTENT_SECTION_CONFLICT");
    }
    throw err;
  }
};

export const removeProductContentSection = async (productId: string, sectionId: string) => {
  const product = await getProductById(productId);
  const section = await findProductContentSectionById(BigInt(sectionId));

  if (!section || section.productId.toString() !== productId) {
    throw new AppError(404, "Product content section not found", "CONTENT_SECTION_NOT_FOUND");
  }

  const deactivated = await deactivateProductContentSection(BigInt(sectionId));
  await invalidateProductDetailCache(productId, product.slug);
  return deactivated;
};

export const getScopedVariant = async (productId: string, variantId: string) => {
  return getScopedVariantById(productId, variantId);
};

export const updateScopedProductVariant = async (
  productId: string,
  variantId: string,
  data: UpdateVariantInput,
) => {
  await getScopedVariantById(productId, variantId);
  return updateProductVariant(variantId, data);
};

export const deleteScopedProductVariant = async (productId: string, variantId: string) => {
  await getScopedVariantById(productId, variantId);
  return deleteProductVariant(variantId);
};

export const adjustScopedStock = async (
  productId: string,
  variantId: string,
  data: StockAdjustmentInput,
) => {
  await getScopedVariantById(productId, variantId);
  return adjustStock(variantId, data);
};

export const removeScopedProductImage = async (productId: string, imageId: string) => {
  const image = await findProductImageById(BigInt(imageId));
  if (!image || image.productId?.toString() !== productId) {
    throw new AppError(404, "Image not found", "IMAGE_NOT_FOUND");
  }

  const deleted = await deleteProductImage(BigInt(imageId));
  const product = await findProductById(BigInt(productId));
  await invalidateProductDetailCache(productId, product?.slug);

  // Delete R2 objects — accept eventual consistency (log failures, don't roll back DB)
  const urlsToDelete = [...new Set([image.imageUrl, image.heroImageUrl, image.thumbnailImageUrl].filter(Boolean))] as string[];
  for (const url of urlsToDelete) {
    if (url.startsWith(env.R2_PUBLIC_URL)) {
      const key = url.slice(env.R2_PUBLIC_URL.length + 1);
      deleteObjectFromR2(key).catch((err) =>
        logger.warn({ err, key }, "[products] Failed to delete R2 object — orphaned"),
      );
    }
  }

  return deleted;
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getAllCategories = async () => {
  return findAllCategories();
};

export const getCategoryById = async (id: string) => {
  const category = await findCategoryById(BigInt(id));
  if (!category) throw new AppError(404, "Category not found", "CATEGORY_NOT_FOUND");
  return category;
};

export const createNewCategory = async (data: CreateCategoryInput) => {
  return createCategory(data);
};

export const updateExistingCategory = async (id: string, data: UpdateCategoryInput) => {
  await getCategoryById(id);
  return updateCategory(BigInt(id), data);
};

export const deleteCategory = async (id: string) => {
  await getCategoryById(id);
  return softDeleteCategory(BigInt(id));
};
