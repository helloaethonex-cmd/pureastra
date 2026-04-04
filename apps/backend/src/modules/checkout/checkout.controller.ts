import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  checkoutConfirmSchema,
  checkoutPreviewSchema,
  buyNowPreviewSchema,
} from "./checkout.types";
import {
  confirmCheckoutBuyNow,
  confirmCheckoutFromCart,
  previewCheckoutBuyNow,
  previewCheckoutFromCart,
} from "./checkout.service";

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request payload",
      details: err.issues,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
    return res.status(409).json({ error: "Concurrent checkout conflict, please retry" });
  }

  req.log.error({ err }, "Checkout controller error");
  return res.status(500).json({ error: "Internal server error" });
};

export const previewCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const input = checkoutPreviewSchema.parse(req.body);
    const result = await previewCheckoutFromCart(userId, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const confirmCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const idempotencyKey = req.header("Idempotency-Key")?.trim();
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key header is required" });
    }

    const input = checkoutConfirmSchema.parse(req.body);
    const result = await confirmCheckoutFromCart(userId, input, idempotencyKey);
    return res.status(result.httpStatus).json(result.payload);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const previewBuyNowCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const input = buyNowPreviewSchema.parse(req.body);
    const result = await previewCheckoutBuyNow(userId, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const confirmBuyNowCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const idempotencyKey = req.header("Idempotency-Key")?.trim();
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key header is required" });
    }

    const input = checkoutConfirmSchema.parse(req.body);
    const result = await confirmCheckoutBuyNow(userId, input, idempotencyKey);
    return res.status(result.httpStatus).json(result.payload);
  } catch (err) {
    return handleError(req, res, err);
  }
};

