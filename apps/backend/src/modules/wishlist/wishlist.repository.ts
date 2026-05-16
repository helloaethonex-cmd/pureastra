import { prisma } from "../../lib/prisma";

const wishlistItemInclude = {
  productVariant: {
    select: {
      id: true,
      isActive: true,
      deletedAt: true,
      price: true,
      mrp: true,
      variantName: true,
      sku: true,
      product: {
        select: {
          id: true,
          uuid: true,
          name: true,
          slug: true,
          brand: true,
          isActive: true,
          deletedAt: true,
          // Cover image: product-level images sorted by position
          images: {
            orderBy: { position: "asc" as const },
            take: 1,
            select: { imageUrl: true },
          },
        },
      },
      images: {
        orderBy: { position: "asc" as const },
        take: 1,
      },
    },
  },
} as const;

export const findWishlistItemsByUserId = (userId: bigint) => {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: wishlistItemInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const findWishlistItemByUserAndVariant = (
  userId: bigint,
  productVariantId: bigint,
) => {
  return prisma.wishlistItem.findUnique({
    where: {
      userId_productVariantId: {
        userId,
        productVariantId,
      },
    },
    include: wishlistItemInclude,
  });
};

export const findActiveVariantForWishlist = (productVariantId: bigint) => {
  return prisma.productVariant.findFirst({
    where: {
      id: productVariantId,
      deletedAt: null,
      isActive: true,
      product: {
        is: {
          deletedAt: null,
          isActive: true,
        },
      },
    },
    select: { id: true },
  });
};

export const createWishlistItem = (userId: bigint, productVariantId: bigint) => {
  return prisma.wishlistItem.create({
    data: {
      userId,
      productVariantId,
    },
    include: wishlistItemInclude,
  });
};

export const deleteWishlistItemByUserAndVariant = (
  userId: bigint,
  productVariantId: bigint,
) => {
  return prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productVariantId,
    },
  });
};
