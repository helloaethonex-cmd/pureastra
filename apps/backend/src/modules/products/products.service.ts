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
  findAllCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from "./products.repository";
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
} from "./products.types";

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = async (query: ProductQuery) => {
  return findAllProducts(query);
};

export const getProductById = async (id: string) => {
  const product = await findProductById(BigInt(id));
  if (!product) throw { status: 404, message: "Product not found" };
  return product;
};

export const getProductBySlug = async (slug: string) => {
  const product = await findProductBySlug(slug);
  if (!product) throw { status: 404, message: "Product not found" };
  return product;
};

export const createNewProduct = async (data: CreateProductInput) => {
  return createProduct(data);
};

export const updateExistingProduct = async (id: string, data: UpdateProductInput) => {
  await getProductById(id); // ensure exists
  return updateProduct(BigInt(id), data);
};

export const deleteProduct = async (id: string) => {
  await getProductById(id); // ensure exists
  return softDeleteProduct(BigInt(id));
};

// ─── Product Categories ───────────────────────────────────────────────────────

export const assignCategories = async (productId: string, categoryIds: bigint[]) => {
  await getProductById(productId);
  return assignCategoriesToProduct(BigInt(productId), categoryIds);
};

export const removeCategory = async (productId: string, categoryId: string) => {
  await getProductById(productId);
  return removeCategoryFromProduct(BigInt(productId), BigInt(categoryId));
};

// ─── Product Variants ─────────────────────────────────────────────────────────

export const getVariantById = async (id: string) => {
  const variant = await findVariantById(BigInt(id));
  if (!variant) throw { status: 404, message: "Variant not found" };
  return variant;
};

export const addVariantToProduct = async (productId: string, data: CreateVariantInput) => {
  await getProductById(productId);
  return createVariant(BigInt(productId), data);
};

export const updateProductVariant = async (variantId: string, data: UpdateVariantInput) => {
  await getVariantById(variantId);
  return updateVariant(BigInt(variantId), data);
};

export const deleteProductVariant = async (variantId: string) => {
  await getVariantById(variantId);
  return softDeleteVariant(BigInt(variantId));
};

export const adjustStock = async (variantId: string, data: StockAdjustmentInput) => {
  await getVariantById(variantId);
  return adjustVariantStock(BigInt(variantId), data);
};

// ─── Product Images ───────────────────────────────────────────────────────────

export const addImageToProduct = async (productId: string, data: AddProductImageInput) => {
  await getProductById(productId);
  return addProductImage(BigInt(productId), data);
};

export const removeProductImage = async (imageId: string) => {
  return deleteProductImage(BigInt(imageId));
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getAllCategories = async () => {
  return findAllCategories();
};

export const getCategoryById = async (id: string) => {
  const category = await findCategoryById(BigInt(id));
  if (!category) throw { status: 404, message: "Category not found" };
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
