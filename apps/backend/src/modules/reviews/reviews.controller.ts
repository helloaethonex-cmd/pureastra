import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  createReviewSchema,
  listReviewsSchema,
  createMetricSchema,
  assignMetricSchema,
  moderateReviewSchema,
} from "./reviews.types";
import {
  submitReview,
  listProductReviews,
  getProductReviewMetrics,
  getProductReviewSummary,
  createReviewMetric,
  assignMetricToProductService,
  removeMetricFromProductService,
  moderateReview,
  deleteReviewService,
} from "./reviews.service";

const handleError = (req: Request, res: Response, err: any) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Invalid request payload", details: err.issues });
  }

  // BigInt("abc") throws SyntaxError from URL params
  if (err instanceof SyntaxError && err.message.includes("BigInt")) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Duplicate resource conflict" });
    }
  }

  req.log.error({ err }, "Review operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

// ── User endpoints ───────────────────────────────────────────────────────────

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const input = createReviewSchema.parse(req.body);
    const review = await submitReview(userId, input);

    return res.status(201).json(review);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const input = listReviewsSchema.parse(req.query);
    const result = await listProductReviews(productId, input);

    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getReviewMetrics = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const metrics = await getProductReviewMetrics(productId);

    return res.status(200).json(metrics);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getReviewSummary = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const summary = await getProductReviewSummary(productId);

    return res.status(200).json(summary);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ── Admin endpoints ──────────────────────────────────────────────────────────

export const adminCreateMetric = async (req: Request, res: Response) => {
  try {
    const input = createMetricSchema.parse(req.body);
    const metric = await createReviewMetric(input);

    return res.status(201).json(metric);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const adminAssignMetric = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const input = assignMetricSchema.parse(req.body);
    const result = await assignMetricToProductService(productId, input);

    return res.status(201).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const adminRemoveMetric = async (req: Request, res: Response) => {
  try {
    const { productId, metricId } = req.params as { productId: string; metricId: string };
    await removeMetricFromProductService(productId, metricId);

    return res.status(204).send();
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const adminModerateReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.reviewId as string;
    const input = moderateReviewSchema.parse(req.body);
    const updated = await moderateReview(reviewId, input.isApproved);

    return res.status(200).json(updated);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const adminDeleteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.reviewId as string;
    await deleteReviewService(reviewId);

    return res.status(204).send();
  } catch (err) {
    return handleError(req, res, err);
  }
};
