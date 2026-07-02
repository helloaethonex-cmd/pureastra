import { prisma } from "../../lib/prisma";
import { Prisma } from "../../generated/prisma/client";

// ── Review queries ───────────────────────────────────────────────────────────

export const findReviewByUserAndProduct = (userId: bigint, productId: bigint) =>
  prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });

export const createReviewWithResponses = (
  data: Prisma.ReviewCreateInput,
  metricResponses: { metricId: bigint; value: number }[],
) =>
  prisma.$transaction(async (tx) => {
    const review = await tx.review.create({ data });

    if (metricResponses.length > 0) {
      await tx.reviewMetricResponse.createMany({
        data: metricResponses.map((mr) => ({
          reviewId: review.id,
          metricId: mr.metricId,
          value: mr.value,
        })),
      });
    }

    return review;
  });

export const findReviewsByProductId = (
  productId: bigint,
  opts: { page: number; limit: number; orderBy: Prisma.ReviewOrderByWithRelationInput },
) => {
  const where: Prisma.ReviewWhereInput = {
    productId,
    isApproved: true,
  };

  return Promise.all([
    prisma.review.findMany({
      where,
      orderBy: opts.orderBy,
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      include: {
        user: { select: { name: true, firstName: true, lastName: true, image: true } },
        images: { select: { id: true, imageUrl: true } },
        metricResponses: {
          include: {
            metric: { select: { id: true, name: true, icon: true, unit: true } },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);
};

export const findReviewById = (id: bigint) =>
  prisma.review.findUnique({ where: { id } });

export const updateReviewApproval = (id: bigint, isApproved: boolean) =>
  prisma.review.update({ where: { id }, data: { isApproved } });

export const deleteReview = (id: bigint) =>
  prisma.review.delete({ where: { id } });

// ── Metric queries ───────────────────────────────────────────────────────────

export const createMetric = (data: Prisma.ReviewMetricCreateInput) =>
  prisma.reviewMetric.create({ data });

export const upsertMetricByName = (
  name: string,
  data: { icon?: string; minValue: number; maxValue: number; unit: "PERCENT" | "RATING" },
) =>
  prisma.reviewMetric.upsert({
    where: { name },
    create: {
      name,
      icon: data.icon,
      minValue: data.minValue,
      maxValue: data.maxValue,
      unit: data.unit,
    },
    update: {
      icon: data.icon,
      minValue: data.minValue,
      maxValue: data.maxValue,
      unit: data.unit,
    },
  });

export const findAllMetrics = () =>
  prisma.reviewMetric.findMany({ orderBy: { name: "asc" } });

export const findMetricsByProductId = (productId: bigint) =>
  prisma.productReviewMetric.findMany({
    where: { productId },
    orderBy: { displayOrder: "asc" },
    include: {
      metric: { select: { id: true, name: true, icon: true, minValue: true, maxValue: true, unit: true } },
    },
  });

export const assignMetricToProduct = (
  productId: bigint,
  metricId: bigint,
  displayOrder: number,
) =>
  prisma.productReviewMetric.create({
    data: { productId, metricId, displayOrder },
  });

export const upsertMetricToProduct = (
  productId: bigint,
  metricId: bigint,
  displayOrder: number,
) =>
  prisma.productReviewMetric.upsert({
    where: { productId_metricId: { productId, metricId } },
    create: { productId, metricId, displayOrder },
    update: { displayOrder },
  });

export const removeMetricFromProduct = (productId: bigint, metricId: bigint) =>
  prisma.productReviewMetric.delete({
    where: { productId_metricId: { productId, metricId } },
  });

// ── Verified purchase check ──────────────────────────────────────────────────

export const hasUserPurchasedProduct = async (
  userId: bigint,
  productId: bigint,
): Promise<{ purchased: boolean; orderId: bigint | null }> => {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      paymentStatus: 1, // SUCCESS
      orderStatus: { not: 5 }, // exclude CANCELLED
      items: {
        some: {
          productVariant: { productId },
        },
      },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return { purchased: !!order, orderId: order?.id ?? null };
};

// ── Summary ──────────────────────────────────────────────────────────────────

export const getReviewSummary = (productId: bigint) =>
  prisma.productReviewSummary.findUnique({ where: { productId } });

// Version-guarded upsert: only writes if the row's updated_at is before startedAt.
// Prevents a slower concurrent refresh from overwriting fresher data.
export const conditionalUpsertReviewSummary = (
  productId: bigint,
  data: { totalReviews: number; avgRating: number; metricAverages: Record<string, number> },
  startedAt: Date,
) =>
  prisma.$executeRaw`
    INSERT INTO "product_review_summaries" ("product_id", "total_reviews", "avg_rating", "metric_averages", "updated_at")
    VALUES (${productId}, ${data.totalReviews}, ${data.avgRating}, ${JSON.stringify(data.metricAverages)}::jsonb, NOW())
    ON CONFLICT ("product_id")
    DO UPDATE SET
      "total_reviews" = EXCLUDED."total_reviews",
      "avg_rating"    = EXCLUDED."avg_rating",
      "metric_averages" = EXCLUDED."metric_averages",
      "updated_at"    = NOW()
    WHERE "product_review_summaries"."updated_at" < ${startedAt}
  `;

export const upsertReviewSummary = (
  productId: bigint,
  data: {
    totalReviews: number;
    avgRating: number;
    metricAverages: Record<string, number>;
  },
) =>
  prisma.productReviewSummary.upsert({
    where: { productId },
    create: {
      productId,
      totalReviews: data.totalReviews,
      avgRating: data.avgRating,
      metricAverages: data.metricAverages,
    },
    update: {
      totalReviews: data.totalReviews,
      avgRating: data.avgRating,
      metricAverages: data.metricAverages,
    },
  });

export const computeReviewAggregates = async (productId: bigint) => {
  const [agg, metricAggs] = await Promise.all([
    prisma.review.aggregate({
      where: { productId, isApproved: true },
      _count: true,
      _avg: { rating: true },
    }),
    prisma.reviewMetricResponse.groupBy({
      by: ["metricId"],
      where: {
        review: { productId, isApproved: true },
      },
      _avg: { value: true },
    }),
  ]);

  const metricAverages: Record<string, number> = {};
  for (const m of metricAggs) {
    metricAverages[m.metricId.toString()] = Math.round(m._avg.value ?? 0);
  }

  return {
    totalReviews: agg._count,
    avgRating: Number((agg._avg.rating ?? 0).toFixed(2)),
    metricAverages,
  };
};
