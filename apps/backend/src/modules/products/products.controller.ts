import { Request, Response } from "express";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createNewProduct,
  updateExistingProduct,
  deleteProduct,
  assignCategories,
  removeCategory as removeCategoryFromProduct,
  addVariantToProduct,
  updateProductVariant,
  deleteProductVariant,
  adjustStock,
  addImageToProduct,
  removeProductImage,
  getAllCategories,
  getCategoryById,
  createNewCategory,
  updateExistingCategory,
  deleteCategory,
  getVariantById,
} from "./products.service";
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  addProductImageSchema,
  createCategorySchema,
  updateCategorySchema,
  stockAdjustmentSchema,
} from "./products.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Express 5 typing: params values are always strings at runtime */
const param = (req: Request, key: string): string => req.params[key] as string;

const handleError = (res: Response, err: any) => {
  if (err?.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};

// ─── Products ─────────────────────────────────────────────────────────────────

/** GET /products */
export const listProducts = async (req: Request, res: Response) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await getAllProducts(query);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /products/slug/:slug */
export const getProductSlug = async (req: Request, res: Response) => {
  try {
    const product = await getProductBySlug(param(req, "slug"));
    res.status(200).json(product);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /products/:id */
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await getProductById(param(req, "id"));
    res.status(200).json(product);
  } catch (err) {
    handleError(res, err);
  }
};

/** POST /products */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await createNewProduct(data);
    res.status(201).json(product);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /products/:id */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await updateExistingProduct(param(req, "id"), data);
    res.status(200).json(product);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /products/:id */
export const removeProduct = async (req: Request, res: Response) => {
  try {
    await deleteProduct(param(req, "id"));
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Product Categories ───────────────────────────────────────────────────────

/** POST /products/:id/categories */
export const assignProductCategories = async (req: Request, res: Response) => {
  try {
    const { categoryIds } = req.body as { categoryIds: string[] };
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: "categoryIds must be a non-empty array" });
    }
    const result = await assignCategories(
      param(req, "id"),
      categoryIds.map((id) => BigInt(id))
    );
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /products/:id/categories/:categoryId */
export const removeProductCategory = async (req: Request, res: Response) => {
  try {
    await removeCategoryFromProduct(param(req, "id"), param(req, "categoryId"));
    res.status(200).json({ message: "Category removed from product" });
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Product Variants ─────────────────────────────────────────────────────────

/** GET /products/:id/variants/:variantId */
export const getVariant = async (req: Request, res: Response) => {
  try {
    const variant = await getVariantById(param(req, "variantId"));
    res.status(200).json(variant);
  } catch (err) {
    handleError(res, err);
  }
};

/** POST /products/:id/variants */
export const addVariant = async (req: Request, res: Response) => {
  try {
    const data = createVariantSchema.parse(req.body);
    const variant = await addVariantToProduct(param(req, "id"), data);
    res.status(201).json(variant);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /products/:id/variants/:variantId */
export const updateVariant = async (req: Request, res: Response) => {
  try {
    const data = updateVariantSchema.parse(req.body);
    const variant = await updateProductVariant(param(req, "variantId"), data);
    res.status(200).json(variant);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /products/:id/variants/:variantId */
export const removeVariant = async (req: Request, res: Response) => {
  try {
    await deleteProductVariant(param(req, "variantId"));
    res.status(200).json({ message: "Variant deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /products/:id/variants/:variantId/stock */
export const updateStock = async (req: Request, res: Response) => {
  try {
    const data = stockAdjustmentSchema.parse(req.body);
    const variant = await adjustStock(param(req, "variantId"), data);
    res.status(200).json(variant);
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Product Images ───────────────────────────────────────────────────────────

/** POST /products/:id/images */
export const addImage = async (req: Request, res: Response) => {
  try {
    const data = addProductImageSchema.parse(req.body);
    const image = await addImageToProduct(param(req, "id"), data);
    res.status(201).json(image);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /products/:id/images/:imageId */
export const removeImage = async (req: Request, res: Response) => {
  try {
    await removeProductImage(param(req, "imageId"));
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Categories ───────────────────────────────────────────────────────────────

/** GET /products/categories */
export const listCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /products/categories/:id */
export const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await getCategoryById(param(req, "id"));
    res.status(200).json(category);
  } catch (err) {
    handleError(res, err);
  }
};

/** POST /products/categories */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await createNewCategory(data);
    res.status(201).json(category);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /products/categories/:id */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const data = updateCategorySchema.parse(req.body);
    const category = await updateExistingCategory(param(req, "id"), data);
    res.status(200).json(category);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /products/categories/:id */
export const removeCategory = async (req: Request, res: Response) => {
  try {
    await deleteCategory(param(req, "id"));
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};
