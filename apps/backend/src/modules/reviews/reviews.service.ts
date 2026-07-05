import { AppError } from "../../lib/errors/app-error";
import { logger } from "../../lib/logger";
import { env } from "../../config/env";
import {
  CreateReviewInput,
  ListReviewsInput,
  CreateMetricInput,
  AssignMetricInput,
  AddReviewMetricInput,
} from "./reviews.types";
import {
  findReviewByUserAndProduct,
  createReviewWithResponses,
  findReviewsByProductId,
  findReviewById,
  updateReviewApproval,
  deleteReview,
  createMetric,
  upsertMetricByName,
  findMetricsByProductId,
  assignMetricToProduct,
  upsertMetricToProduct,
  removeMetricFromProduct,
  hasUserPurchasedProduct,
  getReviewSummary,
  computeReviewAggregates,
  upsertReviewSummary,
  conditionalUpsertReviewSummary,
} from "./reviews.repository";
import { Prisma } from "../../generated/prisma/client";

// ── Submit review ────────────────────────────────────────────────────────────

export const submitReview = async (userId: string, input: CreateReviewInput) => {
  const uid = BigInt(userId);

  // 1. Check for existing review
  const existing = await findReviewByUserAndProduct(uid, input.productId);
  if (existing) {
    throw new AppError(409, "You have already reviewed this product", "REVIEW_EXISTS");
  }

  // 2. Verified purchase check
  const purchase = await hasUserPurchasedProduct(uid, input.productId);
  if (!purchase.purchased) {
    throw new AppError(
      403,
      "Only customers who have purchased this product can add a review",
      "REVIEW_NOT_ALLOWED",
    );
  }

  // 2b. Validate image URLs originate from our R2 bucket
  if (input.images && input.images.length > 0) {
    const invalidUrl = input.images.find((url) => !url.startsWith(env.R2_PUBLIC_URL));
    if (invalidUrl) {
      throw new AppError(400, "Review images must be uploaded via the review-image upload endpoint", "INVALID_IMAGE_URL");
    }
  }

  // 3. Validate metric responses against product-configured metrics
  const metricResponses: { metricId: bigint; value: number }[] = [];
  if (input.metrics && input.metrics.length > 0) {
    const configured = await findMetricsByProductId(input.productId);
    const configuredMap = new Map(
      configured.map((c) => [c.metric.id.toString(), c.metric]),
    );

    for (const mr of input.metrics) {
      const metric = configuredMap.get(mr.metricId.toString());
      if (!metric) {
        throw new AppError(
          400,
          `Metric ${mr.metricId} is not configured for this product`,
          "INVALID_METRIC",
        );
      }

      if (mr.value < metric.minValue || mr.value > metric.maxValue) {
        throw new AppError(
          400,
          `Value for "${metric.name}" must be between ${metric.minValue} and ${metric.maxValue}`,
          "METRIC_VALUE_OUT_OF_RANGE",
        );
      }

      metricResponses.push({ metricId: mr.metricId, value: mr.value });
    }
  }

  // 4. Create review + metric responses in a transaction
  const reviewData: Prisma.ReviewCreateInput = {
    user: { connect: { id: uid } },
    product: { connect: { id: input.productId } },
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    ...(input.images && input.images.length > 0
      ? {
          images: {
            create: input.images.map((imageUrl) => ({ imageUrl })),
          },
        }
      : {}),
    isVerifiedPurchase: purchase.purchased,
    ...(purchase.orderId
      ? { order: { connect: { id: purchase.orderId } } }
      : {}),
  };

  const review = await createReviewWithResponses(reviewData, metricResponses);

  // 5. Update pre-aggregated summary (fire-and-forget – don't block response)
  refreshSummary(input.productId).catch((err) =>
    logger.error({ err, productId: input.productId.toString() }, "Failed to refresh review summary"),
  );

  return review;
};

// ── List product reviews ─────────────────────────────────────────────────────

export const listProductReviews = async (
  productId: string,
  input: ListReviewsInput,
) => {
  const pid = BigInt(productId);

  const orderByMap: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
    newest: { createdAt: "desc" },
    highest: { rating: "desc" },
    lowest: { rating: "asc" },
  };

  const [reviews, total] = await findReviewsByProductId(pid, {
    page: input.page,
    limit: input.limit,
    orderBy: orderByMap[input.sortBy],
  });

  return {
    data: reviews.map((r) => ({
      id: r.id.toString(),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      user: {
        name: r.user.name ?? ([r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || "Anonymous"),
        image: r.user.image,
      },
      images: r.images.map((img) => ({
        id: img.id.toString(),
        imageUrl: img.imageUrl,
      })),
      metrics: r.metricResponses.map((mr) => ({
        metricId: mr.metric.id.toString(),
        name: mr.metric.name,
        icon: mr.metric.icon,
        unit: mr.metric.unit,
        value: mr.value,
      })),
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

// ── Product review metrics ───────────────────────────────────────────────────

export const getProductReviewMetrics = async (productId: string) => {
  const configured = await findMetricsByProductId(BigInt(productId));
  return configured.map((c) => ({
    id: c.metric.id.toString(),
    name: c.metric.name,
    icon: c.metric.icon,
    minValue: c.metric.minValue,
    maxValue: c.metric.maxValue,
    unit: c.metric.unit,
    displayOrder: c.displayOrder,
  }));
};

// ── Product review summary ───────────────────────────────────────────────────

export const getProductReviewSummary = async (productId: string) => {
  const pid = BigInt(productId);
  let summary = await getReviewSummary(pid);

  if (!summary) {
    // First time — compute and store
    const agg = await computeReviewAggregates(pid);
    summary = await upsertReviewSummary(pid, agg);
  }

  // Enrich metric averages with names so frontend doesn't need a second call
  const rawAverages = (summary.metricAverages as Record<string, number>) ?? {};
  let enrichedMetrics: { metricId: string; name: string; icon: string | null; average: number }[] = [];

  if (Object.keys(rawAverages).length > 0) {
    const configured = await findMetricsByProductId(pid);
    enrichedMetrics = configured
      .filter((c) => rawAverages[c.metric.id.toString()] !== undefined)
      .map((c) => ({
        metricId: c.metric.id.toString(),
        name: c.metric.name,
        icon: c.metric.icon,
        average: rawAverages[c.metric.id.toString()],
      }));
  }

  return {
    totalReviews: summary.totalReviews,
    avgRating: Number(summary.avgRating),
    metrics: enrichedMetrics,
  };
};

export const getReviewEligibilityService = async (userId: string, productId: string) => {
  const uid = BigInt(userId);
  const pid = BigInt(productId);

  const [purchase, existingReview] = await Promise.all([
    hasUserPurchasedProduct(uid, pid),
    findReviewByUserAndProduct(uid, pid),
  ]);

  const hasPurchased = purchase.purchased;
  const hasReviewed = Boolean(existingReview);

  return {
    hasPurchased,
    hasReviewed,
    canReview: hasPurchased && !hasReviewed,
  };
};

// ── Summary refresh ──────────────────────────────────────────────────────────

const refreshSummary = async (productId: bigint) => {
  const startedAt = new Date();
  const agg = await computeReviewAggregates(productId);
  await conditionalUpsertReviewSummary(productId, agg, startedAt);
};

// ── Admin: metric management ─────────────────────────────────────────────────

export const createReviewMetric = async (input: CreateMetricInput) => {
  return createMetric({
    name: input.name,
    icon: input.icon,
    minValue: input.minValue,
    maxValue: input.maxValue,
    unit: input.unit,
  });
};

export const assignMetricToProductService = async (
  productId: string,
  input: AssignMetricInput,
) => {
  try {
    return await assignMetricToProduct(
      BigInt(productId),
      input.metricId,
      input.displayOrder,
    );
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new AppError(409, "This metric is already assigned to this product");
    }
    if (err?.code === "P2003") {
      throw new AppError(404, "Product or metric not found");
    }
    throw err;
  }
};

export const removeMetricFromProductService = async (
  productId: string,
  metricId: string,
) => {
  try {
    return await removeMetricFromProduct(BigInt(productId), BigInt(metricId));
  } catch (err: any) {
    if (err?.code === "P2025") {
      throw new AppError(404, "Metric assignment not found");
    }
    throw err;
  }
};

export const addReviewMetricToProductService = async (
  productId: string,
  input: AddReviewMetricInput,
) => {
  const productBigInt = BigInt(productId);

  const metric = await upsertMetricByName(input.name, {
    icon: input.icon,
    minValue: input.minValue,
    maxValue: input.maxValue,
    unit: input.unit,
  });

  const mapping = await upsertMetricToProduct(
    productBigInt,
    metric.id,
    input.displayOrder,
  );

  return {
    id: mapping.id.toString(),
    productId: mapping.productId.toString(),
    metricId: mapping.metricId.toString(),
    displayOrder: mapping.displayOrder,
    metric: {
      id: metric.id.toString(),
      name: metric.name,
      icon: metric.icon,
      minValue: metric.minValue,
      maxValue: metric.maxValue,
      unit: metric.unit,
    },
  };
};

// ── Admin: moderation ────────────────────────────────────────────────────────

export const moderateReview = async (reviewId: string, isApproved: boolean) => {
  const review = await findReviewById(BigInt(reviewId));
  if (!review) {
    throw new AppError(404, "Review not found");
  }

  const updated = await updateReviewApproval(review.id, isApproved);

  // Refresh summary after moderation
  refreshSummary(review.productId).catch((err) =>
    logger.error({ err, productId: review.productId.toString() }, "Failed to refresh review summary"),
  );

  return updated;
};

export const deleteReviewService = async (reviewId: string) => {
  const review = await findReviewById(BigInt(reviewId));
  if (!review) {
    throw new AppError(404, "Review not found");
  }

  const productId = review.productId;
  await deleteReview(review.id);

  // Refresh summary after deletion
  refreshSummary(productId).catch((err) =>
    logger.error({ err, productId: productId.toString() }, "Failed to refresh review summary"),
  );
};
