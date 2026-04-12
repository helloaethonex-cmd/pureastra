import {
  findOrCreateCart,
  findCartById,
  upsertCartItem,
  findActiveCartByUserId,
  findActiveCartBySessionId,
  updateCartItemQuantityForUser,
  updateCartItemQuantityForSession,
  removeCartItemForUser,
  removeCartItemForSession,
  clearCartItems,
  mergeGuestCart,
} from "./cart.repository";
import { AddCartItemInput, UpdateCartItemInput, MergeCartInput } from "./cart.types";
import { AppError } from "../../lib/errors/app-error";

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getOrCreateCart = async (userId?: string, sessionId?: string) => {
  if (!userId && !sessionId) {
    throw new AppError(
      400,
      "Session ID is required for guest cart operations",
      "SESSION_ID_REQUIRED",
    );
  }

  const uid = userId ? BigInt(userId) : undefined;
  return findOrCreateCart(uid, sessionId);
};

export const getCartById = async (id: string) => {
  const cart = await findCartById(BigInt(id));
  if (!cart) throw new AppError(404, "Cart not found", "CART_NOT_FOUND");
  return cart;
};

// ─── Cart Items ───────────────────────────────────────────────────────────────

export const addItemToCart = async (userId: string | undefined, sessionId: string | undefined, data: AddCartItemInput) => {
  const cart = await getOrCreateCart(userId, sessionId);
  return upsertCartItem(cart.id, data);
};

export const updateItem = async (
  userId: string | undefined,
  sessionId: string | undefined,
  itemId: string,
  data: UpdateCartItemInput,
) => {
  if (!userId && !sessionId) {
    throw new AppError(
      400,
      "Session ID is required for guest cart operations",
      "SESSION_ID_REQUIRED",
    );
  }

  const updated = userId
    ? await updateCartItemQuantityForUser(BigInt(itemId), BigInt(userId), data)
    : await updateCartItemQuantityForSession(BigInt(itemId), sessionId!, data);

  if (!updated) {
    throw new AppError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
  }

  return updated;
};

export const removeItem = async (
  userId: string | undefined,
  sessionId: string | undefined,
  itemId: string,
) => {
  if (!userId && !sessionId) {
    throw new AppError(
      400,
      "Session ID is required for guest cart operations",
      "SESSION_ID_REQUIRED",
    );
  }

  const removed = userId
    ? await removeCartItemForUser(BigInt(itemId), BigInt(userId))
    : await removeCartItemForSession(BigInt(itemId), sessionId!);

  if (!removed) {
    throw new AppError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
  }
};

export const clearCart = async (
  userId: string | undefined,
  sessionId?: string,
) => {
  if (!userId && !sessionId) {
    throw new AppError(
      400,
      "Session ID is required for guest cart operations",
      "SESSION_ID_REQUIRED",
    );
  }

  const cart = userId
    ? await findActiveCartByUserId(BigInt(userId))
    : await findActiveCartBySessionId(sessionId!);

  if (!cart) {
    return { count: 0 };
  }

  return clearCartItems(cart.id);
};

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────

export const mergeCart = async (userId: string, data: MergeCartInput) => {
  if (!userId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const merged = await mergeGuestCart(BigInt(userId), data.sessionId);
  if (!merged) {
    throw new AppError(404, "Guest cart not found or already empty", "GUEST_CART_NOT_FOUND");
  }
  return merged;
};
