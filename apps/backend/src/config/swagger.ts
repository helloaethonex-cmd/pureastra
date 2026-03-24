import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { env } from "./env";

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
        url: `http://localhost:${env.PORT}`,
        description: "Local development server",
      },
    ],
    tags: [
      { name: "Users", description: "User profile & me endpoints" },
      { name: "Products", description: "Product catalogue management" },
      { name: "Categories", description: "Product category tree management" },
      { name: "Variants", description: "Product variant & stock management" },
      { name: "Images", description: "Product image management" },
      { name: "Cart", description: "Shopping cart — supports both authenticated users and guests" },
      { name: "Addresses", description: "User saved address book" },
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
        // ── Cart ─────────────────────────────────────────────────────────────
        CartItem: {
          type: "object",
          properties: {
            id: { type: "string", example: "12" },
            cartId: { type: "string", example: "3" },
            productVariantId: { type: "string", example: "5" },
            quantity: { type: "integer", example: 2 },
            priceSnapshot: {
              type: "number",
              format: "decimal",
              nullable: true,
              example: 1299.99,
              description: "Price captured at the time the item was added",
            },
            productVariant: {
              allOf: [{ $ref: "#/components/schemas/ProductVariant" }],
              description: "Populated variant with nested product summary",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            id: { type: "string", example: "3" },
            userId: { type: "string", nullable: true, example: "1" },
            sessionId: { type: "string", nullable: true, example: "guest-abc-123" },
            status: {
              type: "integer",
              enum: [0, 1, 2],
              example: 0,
              description: "0 = ACTIVE, 1 = CHECKED_OUT, 2 = ABANDONED",
            },
            abandonedAt: { type: "string", format: "date-time", nullable: true },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/CartItem" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AddCartItemBody: {
          type: "object",
          required: ["productVariantId", "quantity"],
          properties: {
            productVariantId: {
              type: "string",
              example: "5",
              description: "ID of the product variant to add",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              example: 2,
            },
          },
        },
        UpdateCartItemBody: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: {
              type: "integer",
              minimum: 1,
              example: 3,
              description: "New absolute quantity for this cart item",
            },
          },
        },
        MergeCartBody: {
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: {
              type: "string",
              example: "guest-abc-123",
              description: "Guest session ID whose cart should be merged into the user cart",
            },
          },
        },
        // ── Address ──────────────────────────────────────────────────────────
        Address: {
          type: "object",
          properties: {
            id: { type: "string", example: "3" },
            userId: { type: "string", example: "1" },
            addressType: {
              type: "string",
              enum: ["SHIPPING", "BILLING", "BOTH"],
              nullable: true,
              example: "SHIPPING",
            },
            fullName: { type: "string", example: "Aarav Shah" },
            phone: { type: "string", example: "+919876543210" },
            line1: { type: "string", example: "42, MG Road" },
            line2: { type: "string", nullable: true, example: "Bandra West" },
            city: { type: "string", example: "Mumbai" },
            state: { type: "string", example: "Maharashtra" },
            postalCode: { type: "string", example: "400050" },
            country: { type: "string", example: "INDIA" },
            isDefault: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateAddressBody: {
          type: "object",
          required: ["fullName", "phone", "line1", "city", "state", "postalCode"],
          properties: {
            addressType: {
              type: "string",
              enum: ["SHIPPING", "BILLING", "BOTH"],
              example: "SHIPPING",
            },
            fullName: { type: "string", maxLength: 100, example: "Aarav Shah" },
            phone: { type: "string", maxLength: 20, example: "+919876543210" },
            line1: { type: "string", maxLength: 255, example: "42, MG Road" },
            line2: { type: "string", maxLength: 255, example: "Bandra West" },
            city: { type: "string", maxLength: 100, example: "Mumbai" },
            state: { type: "string", maxLength: 100, example: "Maharashtra" },
            postalCode: { type: "string", maxLength: 20, example: "400050" },
            country: { type: "string", maxLength: 50, default: "INDIA", example: "INDIA" },
            isDefault: { type: "boolean", default: false, example: true },
          },
        },
        UpdateAddressBody: {
          type: "object",
          properties: {
            addressType: {
              type: "string",
              enum: ["SHIPPING", "BILLING", "BOTH"],
              example: "BILLING",
            },
            fullName: { type: "string", maxLength: 100, example: "Aarav Shah" },
            phone: { type: "string", maxLength: 20, example: "+919999999999" },
            line1: { type: "string", maxLength: 255, example: "10, Park Street" },
            line2: { type: "string", maxLength: 255, example: "Floor 2" },
            city: { type: "string", maxLength: 100, example: "Bengaluru" },
            state: { type: "string", maxLength: 100, example: "Karnataka" },
            postalCode: { type: "string", maxLength: 20, example: "560001" },
            country: { type: "string", maxLength: 50, example: "INDIA" },
            isDefault: { type: "boolean", example: false },
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
