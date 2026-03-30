import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  addWishlistItem,
  getWishlistForUser,
  moveWishlistItemToCart,
  removeWishlistItem,
} from "./wishlist.service";
import {
  addWishlistItemSchema,
  wishlistVariantParamsSchema,
} from "./wishlist.types";

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
    return res
      .status(400)
      .json({ error: "Invalid request payload", details: err.issues });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2034") {
      return res.status(409).json({ error: "Concurrent conflict, please retry" });
    }
  }

  req.log.error({ err }, "Wishlist controller error");
  return res.status(500).json({ error: "Internal server error" });
};

export const listWishlistItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const items = await getWishlistForUser(userId);
    return res.status(200).json(items);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const createWishlistItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = addWishlistItemSchema.parse(req.body);
    const result = await addWishlistItem(userId, body.productVariantId);
    return res.status(result.created ? 201 : 200).json(result.item);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const deleteWishlistItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const params = wishlistVariantParamsSchema.parse(req.params);
    await removeWishlistItem(userId, params.productVariantId);
    return res.status(200).json({ message: "Wishlist item removed" });
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const moveWishlistItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const params = wishlistVariantParamsSchema.parse(req.params);
    await moveWishlistItemToCart(userId, params.productVariantId);
    return res.status(200).json({ message: "Item moved to cart" });
  } catch (err) {
    return handleError(req, res, err);
  }
};
