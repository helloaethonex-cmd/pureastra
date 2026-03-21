import { prisma } from "../../lib/prisma";
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
import { v4 as uuidv4 } from "uuid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const productFullInclude = {
  variants: {
    where: { deletedAt: null },
    include: { images: true },
  },
  categories: { include: { category: true } },
  images: true,
} as const;

// ─── Products ─────────────────────────────────────────────────────────────────

export const findAllProducts = async (query: ProductQuery) => {
  const { page, limit, search, categoryId, brand, isActive, minPrice, maxPrice, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    ...(isActive !== undefined && { isActive }),
    ...(brand && { brand: { contains: brand, mode: "insensitive" } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && {
      categories: { some: { categoryId } },
    }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          variants: {
            some: {
              deletedAt: null,
              ...(minPrice !== undefined && { price: { gte: minPrice } }),
              ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
            },
          },
        }
      : {}),
  };

  const orderBy =
    sortBy === "price"
      ? { variants: { _count: sortOrder } }
      : { [sortBy]: sortOrder };

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: productFullInclude,
    }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const findProductById = async (id: bigint) => {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: productFullInclude,
  });
};

export const findProductBySlug = async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: productFullInclude,
  });
};

export const createProduct = async (data: CreateProductInput) => {
  const { categoryIds, variants, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      uuid: uuidv4(),
      ...(categoryIds?.length && {
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      }),
      ...(variants?.length && {
        variants: {
          create: variants.map((v) => ({
            ...v,
            price: v.price !== undefined ? v.price : undefined,
            costPrice: v.costPrice !== undefined ? v.costPrice : undefined,
          })),
        },
      }),
    },
    include: productFullInclude,
  });
};

export const updateProduct = async (id: bigint, data: UpdateProductInput) => {
  return prisma.product.update({
    where: { id },
    data,
    include: productFullInclude,
  });
};

export const softDeleteProduct = async (id: bigint) => {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// ─── Product Categories ───────────────────────────────────────────────────────

export const assignCategoriesToProduct = async (productId: bigint, categoryIds: bigint[]) => {
  const creates = categoryIds.map((categoryId) =>
    prisma.productCategory.upsert({
      where: { productId_categoryId: { productId, categoryId } },
      create: { productId, categoryId, createdAt: new Date() },
      update: {},
    })
  );
  return prisma.$transaction(creates);
};

export const removeCategoryFromProduct = async (productId: bigint, categoryId: bigint) => {
  return prisma.productCategory.delete({
    where: { productId_categoryId: { productId, categoryId } },
  });
};

// ─── Product Variants ─────────────────────────────────────────────────────────

export const findVariantById = async (id: bigint) => {
  return prisma.productVariant.findFirst({
    where: { id, deletedAt: null },
    include: { images: true },
  });
};

export const createVariant = async (productId: bigint, data: CreateVariantInput) => {
  return prisma.productVariant.create({
    data: {
      ...data,
      productId,
      price: data.price !== undefined ? data.price : undefined,
      costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
    },
    include: { images: true },
  });
};

export const updateVariant = async (id: bigint, data: UpdateVariantInput) => {
  return prisma.productVariant.update({
    where: { id },
    data,
    include: { images: true },
  });
};

export const softDeleteVariant = async (id: bigint) => {
  return prisma.productVariant.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const adjustVariantStock = async (id: bigint, data: StockAdjustmentInput) => {
  return prisma.productVariant.update({
    where: { id },
    data: {
      stockQuantity: { increment: data.quantity },
    },
  });
};

// ─── Product Images ───────────────────────────────────────────────────────────

export const addProductImage = async (productId: bigint, data: AddProductImageInput) => {
  return prisma.productImage.create({
    data: {
      productId,
      variantId: data.variantId ?? null,
      imageUrl: data.imageUrl,
      position: data.position ?? 0,
    },
  });
};

export const deleteProductImage = async (imageId: bigint) => {
  return prisma.productImage.delete({ where: { id: imageId } });
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const findAllCategories = async () => {
  return prisma.category.findMany({
    where: { deletedAt: null },
    include: { children: { where: { deletedAt: null } } },
    orderBy: { name: "asc" },
  });
};

export const findCategoryById = async (id: bigint) => {
  return prisma.category.findFirst({
    where: { id, deletedAt: null },
    include: {
      children: { where: { deletedAt: null } },
      parent: true,
      products: { include: { product: true }, take: 10 },
    },
  });
};

export const createCategory = async (data: CreateCategoryInput) => {
  return prisma.category.create({ data });
};

export const updateCategory = async (id: bigint, data: UpdateCategoryInput) => {
  return prisma.category.update({ where: { id }, data });
};

export const softDeleteCategory = async (id: bigint) => {
  return prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
