import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  // Products
  listProducts,
  getProduct,
  getProductSlug,
  createProduct,
  updateProduct,
  removeProduct,
  // Product Categories
  assignProductCategories,
  removeProductCategory,
  // Product Variants
  getVariant,
  addVariant,
  updateVariant,
  removeVariant,
  updateStock,
  // Product Images
  addImage,
  removeImage,
  listProductContent,
  listProductContentAdmin,
  createProductContent,
  updateProductContent,
  deleteProductContent,
  // Categories
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  removeCategory,
} from "./products.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY ROUTES  (declared before /:id to prevent param collision)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List all categories
 *     description: >
 *       Returns all non-deleted categories, each including their non-deleted
 *       direct children.
 *     responses:
 *       200:
 *         description: Array of categories with nested children
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryWithChildren'
 *             example:
 *               - id: "1"
 *                 name: "Skincare"
 *                 slug: "skincare"
 *                 description: "All skincare products"
 *                 parentId: null
 *                 children:
 *                   - id: "3"
 *                     name: "Serums"
 *                     slug: "serums"
 *                     parentId: "1"
 *                     children: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a new category
 *     description: >
 *       Creates a top-level or nested category. Provide `parentId` to nest it
 *       under an existing category. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryBody'
 *           example:
 *             name: "Haircare"
 *             slug: "haircare"
 *             description: "Shampoos, conditioners and treatments"
 *     responses:
 *       201:
 *         description: Newly created category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error (e.g. missing name)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories", listCategories);
router.post("/categories", requireAuth, requireRole("admin"), createCategory);

/**
 * @openapi
 * /api/v1/products/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get a single category
 *     description: >
 *       Returns a category by its numeric ID, including its parent and up to
 *       10 of its associated products.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric category ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Category detail with parent and product preview
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryWithChildren'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Category not found"
 *
 *   patch:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     description: Partially update any field of an existing category. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric category ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryBody'
 *           example:
 *             name: "Skincare & Wellness"
 *             description: "Expanded skincare range including wellness products"
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Soft-delete a category
 *     description: >
 *       Marks the category as deleted by setting `deletedAt`. The record is
 *       retained in the database and will be excluded from list/get queries.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric category ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Category successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Category deleted successfully"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories/:id", getCategory);
router.patch("/categories/:id", requireAuth, requireRole("admin"), updateCategory);
router.delete("/categories/:id", requireAuth, requireRole("admin"), removeCategory);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: List products
 *     description: >
 *       Returns a paginated, filterable list of non-deleted products.
 *       Supports free-text search across name, description and brand.
 *       No authentication required.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search across name, description, brand
 *         example: "serum"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *         example: "3"
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand name (case-insensitive partial match)
 *         example: "Pureastra"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *         example: "true"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum variant price filter
 *         example: 500
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum variant price filter
 *         example: 2000
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, price]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductList'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product
 *     description: >
 *       Creates a product, optionally with inline variants and category assignments.
 *       A UUID is auto-generated. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductBody'
 *           example:
 *             name: "Hydrating Serum"
 *             slug: "hydrating-serum"
 *             description: "Lightweight daily serum with hyaluronic acid."
 *             brand: "Pureastra"
 *             isActive: true
 *             categoryIds: ["1", "3"]
 *             variants:
 *               - variantName: "30ml"
 *                 sku: "HS-30ML"
 *                 price: 799
 *                 stockQuantity: 100
 *               - variantName: "100ml"
 *                 sku: "HS-100ML"
 *                 price: 1299
 *                 stockQuantity: 200
 *     responses:
 *       201:
 *         description: Newly created product with variants, categories, and images (detail content sections are fetched via product detail endpoints)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", listProducts);
router.post("/", requireAuth, requireRole("admin"), createProduct);

/**
 * @openapi
 * /api/v1/products/slug/{slug}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by slug
 *     description: >
 *       Retrieves a single active product by its URL-friendly slug.
 *       Suitable for use in storefront product detail pages.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: URL-friendly product slug
 *         example: "hydrating-serum"
 *     responses:
 *       200:
 *         description: Product detail with variants, categories, and images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Product not found"
 */
router.get("/slug/:slug", getProductSlug);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: >
 *       Retrieves a single active product by its numeric database ID,
 *       including all variants, category associations, and images.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Full product detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Product not found"
 *
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     description: >
 *       Partially updates product-level fields (name, description, brand, slug,
 *       isActive). To manage variants or categories use their dedicated endpoints.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductBody'
 *           example:
 *             name: "Ultra Hydrating Serum"
 *             isActive: false
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Products
 *     summary: Soft-delete a product
 *     description: >
 *       Marks the product as deleted (`deletedAt` is set). It is excluded from
 *       all list and get queries but retained for audit/order history purposes.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Product deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getProduct);
router.patch("/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), removeProduct);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT ↔ CATEGORY ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products/{id}/categories:
 *   post:
 *     tags:
 *       - Products
 *     summary: Assign categories to a product
 *     description: >
 *       Bulk-assigns one or more categories to an existing product.
 *       This is an upsert operation — it is safe to call multiple times with
 *       overlapping category IDs. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignCategoriesBody'
 *           example:
 *             categoryIds: ["2", "5"]
 *     responses:
 *       200:
 *         description: Array of created/updated ProductCategory join records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   productId: { type: string }
 *                   categoryId: { type: string }
 *       400:
 *         description: categoryIds missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/categories", requireAuth, requireRole("admin"), assignProductCategories);

/**
 * @openapi
 * /api/v1/products/{id}/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Remove a category from a product
 *     description: >
 *       Detaches a single category from a product by deleting the join record.
 *       The product and the category themselves are NOT deleted.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric category ID to detach
 *         example: "3"
 *     responses:
 *       200:
 *         description: Category successfully removed from product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Category removed from product"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product or category assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id/categories/:categoryId", requireAuth, requireRole("admin"), removeProductCategory);

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products/{id}/variants/{variantId}:
 *   get:
 *     tags:
 *       - Variants
 *     summary: Get a single variant
 *     description: Returns a product variant by its ID, including its images. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric variant ID
 *         example: "5"
 *     responses:
 *       200:
 *         description: Variant detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Variant not found"
 *
 *   patch:
 *     tags:
 *       - Variants
 *     summary: Update a variant
 *     description: >
 *       Partially updates any field of an existing product variant.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric variant ID
 *         example: "5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVariantBody'
 *           example:
 *             price: 899
 *             stockQuantity: 150
 *             isActive: true
 *     responses:
 *       200:
 *         description: Updated variant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Variants
 *     summary: Soft-delete a variant
 *     description: >
 *       Marks the variant as deleted (`deletedAt` is set). The variant is
 *       excluded from product queries but retained for order history.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric variant ID
 *         example: "5"
 *     responses:
 *       200:
 *         description: Variant deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Variant deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/variants/:variantId", requireAuth, getVariant);
router.patch("/:id/variants/:variantId", requireAuth, requireRole("admin"), updateVariant);
router.delete("/:id/variants/:variantId", requireAuth, requireRole("admin"), removeVariant);

/**
 * @openapi
 * /api/v1/products/{id}/variants:
 *   post:
 *     tags:
 *       - Variants
 *     summary: Add a variant to a product
 *     description: >
 *       Creates a new variant (SKU, price, stock, weight etc.) under an existing product.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVariantBody'
 *           example:
 *             variantName: "200ml / Lavender"
 *             sku: "HS-200ML-LAV"
 *             price: 1499
 *             costPrice: 700
 *             stockQuantity: 150
 *             weight: 220
 *             isActive: true
 *     responses:
 *       201:
 *         description: Newly created variant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/variants", requireAuth, requireRole("admin"), addVariant);

/**
 * @openapi
 * /api/v1/products/{id}/variants/{variantId}/stock:
 *   patch:
 *     tags:
 *       - Variants
 *     summary: Adjust variant stock
 *     description: >
 *       Increments or decrements the `stockQuantity` of a variant by the given `quantity`.
 *       Use a positive value to add stock (e.g. new shipment) and a negative value
 *       to deduct it (e.g. write-off, return). **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric variant ID
 *         example: "5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockAdjustmentBody'
 *           examples:
 *             addStock:
 *               summary: Add 50 units (new shipment)
 *               value:
 *                 quantity: 50
 *                 reason: "Received new shipment from supplier"
 *             deductStock:
 *               summary: Deduct 10 units (write-off)
 *               value:
 *                 quantity: -10
 *                 reason: "Damaged goods write-off"
 *     responses:
 *       200:
 *         description: Variant with updated stock quantity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Validation error (e.g. missing quantity)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/variants/:variantId/stock", requireAuth, requireRole("admin"), updateStock);

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products/{id}/images:
 *   post:
 *     tags:
 *       - Images
 *     summary: Add an image to a product
 *     description: >
 *       Attaches an image URL to a product. Optionally pins the image to a
 *       specific variant via `variantId`. The `position` field controls
 *       display order (0 = primary). **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddImageBody'
 *           examples:
 *             productImage:
 *               summary: Product-level image (no variant)
 *               value:
 *                 imageUrl: "https://cdn.pureastra.com/products/serum-front.jpg"
 *                 position: 0
 *             variantImage:
 *               summary: Pin image to a specific variant
 *               value:
 *                 imageUrl: "https://cdn.pureastra.com/products/serum-lavender.jpg"
 *                 variantId: "5"
 *                 position: 1
 *     responses:
 *       201:
 *         description: Newly created product image record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error (e.g. invalid URL)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/images", requireAuth, requireRole("admin"), addImage);

/**
 * @openapi
 * /api/v1/products/{id}/images/{imageId}:
 *   delete:
 *     tags:
 *       - Images
 *     summary: Remove a product image
 *     description: >
 *       Permanently deletes a product image record (hard delete).
 *       The external image file is NOT deleted by this endpoint.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric image ID to delete
 *         example: "10"
 *     responses:
 *       200:
 *         description: Image deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Image deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id/images/:imageId", requireAuth, requireRole("admin"), removeImage);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CONTENT SECTION ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products/{id}/content-sections:
 *   get:
 *     tags:
 *       - Products
 *     summary: List product content sections
 *     description: >
 *       Returns only active content sections (benefits, FAQ, suitable-for,
 *       usage, before-after, etc.) for the given product.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Ordered list of product content sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductContentSectionPublic'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     tags:
 *       - Products
 *     summary: Create product content section
 *     description: >
 *       Creates a content block for a product. Combined uniqueness is enforced on
 *       `(productId, sectionType, position)` to keep display order deterministic.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductContentSectionBody'
 *           example:
 *             sectionType: "BENEFITS"
 *             title: "Benefits"
 *             position: 0
 *             content:
 *               - heading: "Brightens and evens tone"
 *                 description: "Helps reduce dullness with vitamin C."
 *               - heading: "Hydrates and plumps"
 *                 description: "Locks moisture for softer skin."
 *     responses:
 *       201:
 *         description: Created content section
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductContentSection'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate sectionType + position for the same product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/content-sections", listProductContent);

/**
 * @openapi
 * /api/v1/products/{id}/content-sections/admin:
 *   get:
 *     tags:
 *       - Products
 *     summary: List all product content sections (admin)
 *     description: >
 *       Returns both active and inactive content sections for content management.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric product ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Ordered list of content sections including inactive records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductContentSection'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/content-sections/admin", requireAuth, requireRole("admin"), listProductContentAdmin);
router.post("/:id/content-sections", requireAuth, requireRole("admin"), createProductContent);

/**
 * @openapi
 * /api/v1/products/{id}/content-sections/{sectionId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update product content section
 *     description: >
 *       Partially updates a content section. Supports changing section type, title,
 *       content payload, active flag, and display position. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "1"
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "12"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductContentSectionBody'
 *           example:
 *             position: 1
 *             title: "Updated Benefits"
 *     responses:
 *       200:
 *         description: Updated content section
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductContentSection'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product or content section not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate sectionType + position for the same product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Products
 *     summary: Soft-remove product content section
 *     description: >
 *       Deactivates a content section by setting `isActive=false`.
 *       This avoids data loss and preserves auditability. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "1"
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "12"
 *     responses:
 *       200:
 *         description: Content section deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Product content section removed successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product or content section not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/content-sections/:sectionId", requireAuth, requireRole("admin"), updateProductContent);
router.delete("/:id/content-sections/:sectionId", requireAuth, requireRole("admin"), deleteProductContent);

export default router;
