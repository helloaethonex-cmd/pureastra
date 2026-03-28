import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  confirmPaymentAttempt,
  createPaymentForOrder,
} from "./payments.service";
import {
  confirmPaymentBodySchema,
  confirmPaymentParamsSchema,
  createPaymentAttemptBodySchema,
  createPaymentAttemptParamsSchema,
} from "./payments.types";
import { env } from "../../config/env";

const handleError = (req: Request, res: Response, err: unknown) => {
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
      return res.status(409).json({ error: "Concurrent payment conflict, please retry" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Duplicate payment conflict, please retry" });
    }
  }

  req.log.error({ err }, "Payment controller error");
  return res.status(500).json({ error: "Internal server error" });
};

export const createOrderPaymentAttempt = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key header is required" });
    }

    const params = createPaymentAttemptParamsSchema.parse(req.params);
    const body = createPaymentAttemptBodySchema.parse(req.body);

    const payment = await createPaymentForOrder(
      userId,
      params.id,
      idempotencyKey,
      body,
    );

    return res.status(201).json(payment);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const secret = req.header("x-payment-webhook-secret");
    if (!secret || secret !== env.PAYMENT_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const params = confirmPaymentParamsSchema.parse(req.params);
    const body = confirmPaymentBodySchema.parse(req.body);

    const payment = await confirmPaymentAttempt(params.id, body);
    return res.status(200).json(payment);
  } catch (err) {
    return handleError(req, res, err);
  }
};
