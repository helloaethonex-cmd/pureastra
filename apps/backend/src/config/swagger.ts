import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pureastra API",
      version: "1.0.0",
      description: "API documentation for Pureastra backend",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: "Local development server",
      },
    ],
    tags: [
      { name: "Users", description: "User profile & me endpoints" },
      { name: "Products", description: "Product catalogue management" },
      { name: "Categories", description: "Product category tree management" },
      { name: "Variants", description: "Product variant & stock management" },
      { name: "Images", description: "Product image management" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Session cookie set by better-auth on login",
        },
      },
      schemas: {
        // ── Pagination wrapper ────────────────────────────────────────────────
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 150 },
            totalPages: { type: "integer", example: 8 },
          },
        },
        // ── User ──────────────────────────────────────────────────────────────
        Role: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "admin" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            publicId: { type: "string", format: "uuid", example: "a1b2c3d4-…" },
            email: {
              type: "string",
              format: "email",
              example: "user@pureastra.com",
            },
            phone: { type: "string", nullable: true, example: "+919876543210" },
            name: { type: "string", nullable: true, example: "Aarav Shah" },
            firstName: { type: "string", nullable: true, example: "Aarav" },
            lastName: { type: "string", nullable: true, example: "Shah" },
            image: {
              type: "string",
              nullable: true,
              example: "https://cdn.example.com/avatar.jpg",
            },
            isActive: { type: "boolean", example: true },
            emailVerified: { type: "boolean", example: true },
            phoneVerified: { type: "boolean", example: false },
            role: { $ref: "#/components/schemas/Role", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ── Category ─────────────────────────────────────────────────────────
        Category: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "Skincare" },
            slug: { type: "string", example: "skincare", nullable: true },
            description: {
              type: "string",
              nullable: true,
              example: "All skincare products",
            },
            parentId: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        CategoryWithChildren: {
          allOf: [
            { $ref: "#/components/schemas/Category" },
            {
              type: "object",
              properties: {
                children: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          ],
        },
        CreateCategoryBody: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Skincare" },
            slug: { type: "string", example: "skincare" },
            description: { type: "string", example: "All skincare products" },
            parentId: {
              type: "string",
              example: "2",
              description: "Parent category ID for nested categories",
            },
          },
        },
        UpdateCategoryBody: {
          type: "object",
          properties: {
            name: { type: "string", example: "Skincare & Wellness" },
            slug: { type: "string", example: "skincare-wellness" },
            description: { type: "string", example: "Updated description" },
            parentId: { type: "string", example: "3", nullable: true },
          },
        },
        // ── Product Image ────────────────────────────────────────────────────
        ProductImage: {
          type: "object",
          properties: {
            id: { type: "string", example: "10" },
            productId: { type: "string", nullable: true, example: "1" },
            variantId: { type: "string", nullable: true, example: null },
            imageUrl: {
              type: "string",
              format: "uri",
              example: "https://cdn.pureastra.com/p1.jpg",
            },
            position: { type: "integer", example: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AddImageBody: {
          type: "object",
          required: ["imageUrl"],
          properties: {
            imageUrl: {
              type: "string",
              format: "uri",
              example: "https://cdn.pureastra.com/p1.jpg",
            },
            variantId: {
              type: "string",
              example: "5",
              description: "Optional — pin image to a specific variant",
            },
            position: { type: "integer", minimum: 0, example: 0 },
          },
        },
        // ── Variant ──────────────────────────────────────────────────────────
        ProductVariant: {
          type: "object",
          properties: {
            id: { type: "string", example: "5" },
            productId: { type: "string", example: "1" },
            variantName: {
              type: "string",
              nullable: true,
              example: "100ml / Rose Quartz",
            },
            sku: { type: "string", nullable: true, example: "SK-RQTZ-100" },
            price: {
              type: "number",
              format: "decimal",
              nullable: true,
              example: 1299.99,
            },
            costPrice: {
              type: "number",
              format: "decimal",
              nullable: true,
              example: 600.0,
            },
            stockQuantity: { type: "integer", nullable: true, example: 200 },
            stockReserved: { type: "integer", example: 5 },
            weight: {
              type: "integer",
              nullable: true,
              example: 150,
              description: "Weight in grams",
            },
            isActive: { type: "boolean", example: true },
            images: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductImage" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        CreateVariantBody: {
          type: "object",
          properties: {
            variantName: { type: "string", example: "100ml / Rose Quartz" },
            sku: { type: "string", example: "SK-RQTZ-100" },
            price: { type: "number", example: 1299.99 },
            costPrice: { type: "number", example: 600.0 },
            stockQuantity: { type: "integer", minimum: 0, example: 200 },
            weight: { type: "integer", minimum: 0, example: 150 },
            isActive: { type: "boolean", default: true },
          },
        },
        UpdateVariantBody: {
          type: "object",
          properties: {
            variantName: { type: "string", example: "200ml / Rose Quartz" },
            sku: { type: "string", example: "SK-RQTZ-200" },
            price: { type: "number", example: 1799.99 },
            costPrice: { type: "number", example: 850.0 },
            stockQuantity: { type: "integer", minimum: 0, example: 300 },
            weight: { type: "integer", minimum: 0, example: 200 },
            isActive: { type: "boolean", example: false },
          },
        },
        StockAdjustmentBody: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: {
              type: "integer",
              example: 50,
              description:
                "Positive to add stock, negative to reduce (e.g. -10 for a return/loss)",
            },
            reason: {
              type: "string",
              example: "Received new shipment",
              description: "Optional audit note",
            },
          },
        },
        // ── Product ──────────────────────────────────────────────────────────
        Product: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            uuid: { type: "string", format: "uuid" },
            name: { type: "string", example: "Hydrating Serum" },
            slug: {
              type: "string",
              nullable: true,
              example: "hydrating-serum",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Lightweight daily serum with HA.",
            },
            brand: { type: "string", nullable: true, example: "Pureastra" },
            isActive: { type: "boolean", example: true },
            variants: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductVariant" },
            },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { $ref: "#/components/schemas/Category" },
                },
              },
            },
            images: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductImage" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        ProductList: {
          allOf: [
            { $ref: "#/components/schemas/PaginationMeta" },
            {
              type: "object",
              properties: {
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          ],
        },
        CreateProductBody: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Hydrating Serum" },
            slug: { type: "string", example: "hydrating-serum" },
            description: {
              type: "string",
              example: "Lightweight daily serum with HA.",
            },
            brand: { type: "string", example: "Pureastra" },
            isActive: { type: "boolean", default: true },
            categoryIds: {
              type: "array",
              items: { type: "string" },
              example: ["1", "3"],
              description: "List of category IDs to attach on creation",
            },
            variants: {
              type: "array",
              items: { $ref: "#/components/schemas/CreateVariantBody" },
              description:
                "Optional inline variants to create alongside the product",
            },
          },
        },
        UpdateProductBody: {
          type: "object",
          properties: {
            name: { type: "string", example: "Ultra Hydrating Serum" },
            slug: { type: "string", example: "ultra-hydrating-serum" },
            description: { type: "string", example: "Updated description" },
            brand: { type: "string", example: "Pureastra Pro" },
            isActive: { type: "boolean", example: false },
          },
        },
        AssignCategoriesBody: {
          type: "object",
          required: ["categoryIds"],
          properties: {
            categoryIds: {
              type: "array",
              items: { type: "string" },
              example: ["2", "5"],
              description:
                "Category IDs to assign (upsert — safe to call multiple times)",
            },
          },
        },
        // ── Error ─────────────────────────────────────────────────────────────
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Product not found" },
          },
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../modules/**/*.ts")],
});
