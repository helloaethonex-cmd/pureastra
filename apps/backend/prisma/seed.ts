import { prisma } from "../src/lib/prisma";
import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: pino.stdTimeFunctions.isoTime,
});

async function main() {
    await prisma.role.createMany({
        data: [
            { name: "admin" },
            { name: "customer" }
        ],
        skipDuplicates: true
    });

    logger.info("Roles seeded");

    const productId = 13n;
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    });

    if (!product) {
        logger.warn({ productId: productId.toString() }, "Skipped review metric seed: product not found");
        return;
    }

    const metricInputs = [
        { name: "Brightening", icon: "sun", minValue: 0, maxValue: 100, unit: "PERCENT" as const, displayOrder: 0 },
        { name: "Hydration", icon: "droplet", minValue: 0, maxValue: 100, unit: "PERCENT" as const, displayOrder: 1 },
        { name: "Sebum Balance", icon: "balance", minValue: 0, maxValue: 100, unit: "PERCENT" as const, displayOrder: 2 },
    ];

    for (const metricInput of metricInputs) {
        const metric = await prisma.reviewMetric.upsert({
            where: { name: metricInput.name },
            create: {
                name: metricInput.name,
                icon: metricInput.icon,
                minValue: metricInput.minValue,
                maxValue: metricInput.maxValue,
                unit: metricInput.unit,
            },
            update: {
                icon: metricInput.icon,
                minValue: metricInput.minValue,
                maxValue: metricInput.maxValue,
                unit: metricInput.unit,
            },
        });

        await prisma.productReviewMetric.upsert({
            where: {
                productId_metricId: {
                    productId,
                    metricId: metric.id,
                },
            },
            create: {
                productId,
                metricId: metric.id,
                displayOrder: metricInput.displayOrder,
            },
            update: {
                displayOrder: metricInput.displayOrder,
            },
        });
    }

    logger.info({ productId: productId.toString() }, "Review metrics seeded for product");
}

main()
    .catch((error) => {
        logger.error({ err: error }, "Seed failed");
    })
    .finally(() => prisma.$disconnect());
