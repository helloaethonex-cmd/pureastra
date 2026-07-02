import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../lib/errors/app-error";
import { addItemToCart } from "../cart/cart.service";
import {
  createWishlistItem,
  deleteWishlistItemByUserAndVariant,
  findActiveVariantForWishlist,
  findWishlistItemByUserAndVariant,
  findWishlistItemsByUserId,
} from "./wishlist.repository";

const parseUserId = (userId: string) => BigInt(userId);

export const getWishlistForUser = async (userId: string) => {
  const items = await findWishlistItemsByUserId(parseUserId(userId));

  return items.map((item: any) => ({
    ...item,
    isAvailable:
      item.productVariant.deletedAt === null &&
      item.productVariant.isActive &&
      item.productVariant.product.deletedAt === null &&
      item.productVariant.product.isActive,
  }));
};

export const addWishlistItem = async (userId: string, productVariantId: bigint) => {
  const parsedUserId = parseUserId(userId);

  const existing = await findWishlistItemByUserAndVariant(parsedUserId, productVariantId);
  if (existing) {
    return { item: existing, created: false };
  }

  const activeVariant = await findActiveVariantForWishlist(productVariantId);
  if (!activeVariant) {
    throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
  }

  try {
    const item = await createWishlistItem(parsedUserId, productVariantId);
    return { item, created: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const item = await findWishlistItemByUserAndVariant(parsedUserId, productVariantId);
      if (item) return { item, created: false };
    }
    throw err;
  }
};

export const removeWishlistItem = async (userId: string, productVariantId: bigint) => {
  await deleteWishlistItemByUserAndVariant(parseUserId(userId), productVariantId);
};

export const moveWishlistItemToCart = async (userId: string, productVariantId: bigint) => {
  const parsedUserId = parseUserId(userId);
  const wishlistItem = await findWishlistItemByUserAndVariant(parsedUserId, productVariantId);
  if (!wishlistItem) {
    throw new AppError(404, "Wishlist item not found", "WISHLIST_ITEM_NOT_FOUND");
  }

  const isAvailable =
    wishlistItem.productVariant.deletedAt === null &&
    wishlistItem.productVariant.isActive &&
    wishlistItem.productVariant.product.deletedAt === null &&
    wishlistItem.productVariant.product.isActive;
  if (!isAvailable) {
    throw new AppError(
      409,
      "Wishlist item is unavailable and cannot be moved to cart",
      "WISHLIST_ITEM_UNAVAILABLE",
    );
  }

  try {
    await addItemToCart(userId, undefined, {
      productVariantId,
      quantity: 1,
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(500, "Failed to move item to cart", "MOVE_TO_CART_FAILED");
  }

  await deleteWishlistItemByUserAndVariant(parsedUserId, productVariantId);
};
