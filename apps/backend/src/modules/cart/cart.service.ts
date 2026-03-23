import {
  findOrCreateCart,
  findCartById,
  upsertCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
  mergeGuestCart,
} from "./cart.repository";
import { AddCartItemInput, UpdateCartItemInput, MergeCartInput } from "./cart.types";

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getOrCreateCart = async (userId?: string, sessionId?: string) => {
  const uid = userId ? BigInt(userId) : undefined;
  return findOrCreateCart(uid, sessionId);
};

export const getCartById = async (id: string) => {
  const cart = await findCartById(BigInt(id));
  if (!cart) throw { status: 404, message: "Cart not found" };
  return cart;
};

// ─── Cart Items ───────────────────────────────────────────────────────────────

export const addItemToCart = async (userId: string | undefined, sessionId: string | undefined, data: AddCartItemInput) => {
  const cart = await getOrCreateCart(userId, sessionId);
  return upsertCartItem(cart.id, data);
};

export const updateItem = async (itemId: string, data: UpdateCartItemInput) => {
  return updateCartItemQuantity(BigInt(itemId), data);
};

export const removeItem = async (itemId: string) => {
  return removeCartItem(BigInt(itemId));
};

export const clearCart = async (userId: string | undefined, sessionId: string | undefined) => {
  const cart = await getOrCreateCart(userId, sessionId);
  return clearCartItems(cart.id);
};

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────

export const mergeCart = async (userId: string, data: MergeCartInput) => {
  const merged = await mergeGuestCart(BigInt(userId), data.sessionId);
  if (!merged) throw { status: 404, message: "Guest cart not found or already empty" };
  return merged;
};
