import { Request, Response } from "express";
import {
  getOrCreateCart,
  addItemToCart,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
} from "./cart.service";
import {
  addCartItemSchema,
  updateCartItemSchema,
  mergeCartSchema,
  cartItemParamsSchema,
} from "./cart.types";
import { AppError } from "../../lib/errors/app-error";
import { ZodError } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const handleError = (req: Request, res: Response, err: unknown) => {
  if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
    const status = Number((err as { status: unknown }).status);
    const message = String((err as { message: unknown }).message);
    if (Number.isFinite(status)) {
      return res.status(status).json({ error: message });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid request payload", details: err.issues });
  }

  req.log.error({ err }, "Cart controller error");
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
    handleError(req, res, err);
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
    handleError(req, res, err);
  }
};

/** PATCH /cart/items/:itemId */
export const patchItem = async (req: Request, res: Response) => {
  try {
    const params = cartItemParamsSchema.parse(req.params);
    const data = updateCartItemSchema.parse(req.body);
    const userId = req.user?.id?.toString();
    const item = await updateItem(userId, params.itemId.toString(), data);
    res.status(200).json(item);
  } catch (err) {
    handleError(req, res, err);
  }
};

/** DELETE /cart/items/:itemId */
export const deleteItem = async (req: Request, res: Response) => {
  try {
    const params = cartItemParamsSchema.parse(req.params);
    const userId = req.user?.id?.toString();
    await removeItem(userId, params.itemId.toString());
    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    handleError(req, res, err);
  }
};

/** DELETE /cart — clear all items */
export const emptyCart = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = resolveContext(req);
    await clearCart(userId, sessionId);
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    handleError(req, res, err);
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
    handleError(req, res, err);
  }
};
