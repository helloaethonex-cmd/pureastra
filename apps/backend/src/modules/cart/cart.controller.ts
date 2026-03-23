import { Request, Response } from "express";
import {
  getOrCreateCart,
  addItemToCart,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
} from "./cart.service";
import { addCartItemSchema, updateCartItemSchema, mergeCartSchema } from "./cart.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const param = (req: Request, key: string): string => req.params[key] as string;

const handleError = (res: Response, err: any) => {
  if (err?.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};

/** Resolves the current user ID (if authenticated) and the session ID (from header or query). */
const resolveContext = (req: Request) => {
  const userId: string | undefined = (req as any).user?.id?.toString();
  const sessionId: string | undefined =
    (req.headers["x-session-id"] as string) ?? (req.query["sessionId"] as string);
  return { userId, sessionId };
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

/** GET /cart — returns active cart for user or guest session */
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = resolveContext(req);
    const cart = await getOrCreateCart(userId, sessionId);
    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Cart Items ───────────────────────────────────────────────────────────────

/** POST /cart/items */
export const addItem = async (req: Request, res: Response) => {
  try {
    const data = addCartItemSchema.parse(req.body);
    const { userId, sessionId } = resolveContext(req);
    const item = await addItemToCart(userId, sessionId, data);
    res.status(201).json(item);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /cart/items/:itemId */
export const patchItem = async (req: Request, res: Response) => {
  try {
    const data = updateCartItemSchema.parse(req.body);
    const item = await updateItem(param(req, "itemId"), data);
    res.status(200).json(item);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /cart/items/:itemId */
export const deleteItem = async (req: Request, res: Response) => {
  try {
    await removeItem(param(req, "itemId"));
    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /cart — clear all items */
export const emptyCart = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = resolveContext(req);
    await clearCart(userId, sessionId);
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    handleError(res, err);
  }
};

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────

/** POST /cart/merge — merge guest cart into authenticated user cart */
export const mergeGuestCart = async (req: Request, res: Response) => {
  try {
    const data = mergeCartSchema.parse(req.body);
    const userId = (req as any).user?.id?.toString();
    const cart = await mergeCart(userId, data);
    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
};
