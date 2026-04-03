import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  createPaymentForOrder,
  processRazorpayWebhookEvent,
  verifyRazorpayPaymentAttempt,
} from "./payments.service";
import {
  createPaymentAttemptBodySchema,
  createPaymentAttemptParamsSchema,
  razorpayVerifyBodySchema,
  razorpayVerifyParamsSchema,
} from "./payments.types";

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

    const idempotencyKey = req.header("Idempotency-Key")?.trim();
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

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const params = razorpayVerifyParamsSchema.parse(req.params);
    const body = razorpayVerifyBodySchema.parse(req.body);

    const payment = await verifyRazorpayPaymentAttempt(userId, params.id, body);
    return res.status(200).json(payment);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.header("x-razorpay-signature");
    if (!signature) {
      return res.status(401).json({ error: "Missing webhook signature" });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const providerEventIdHeader = req.header("x-razorpay-event-id") ?? undefined;
    const result = await processRazorpayWebhookEvent(
      req.body,
      signature,
      providerEventIdHeader,
    );

    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};
