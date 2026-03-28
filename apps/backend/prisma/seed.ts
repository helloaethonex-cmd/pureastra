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
}

main()
    .catch((error) => {
        logger.error({ err: error }, "Seed failed");
    })
    .finally(() => prisma.$disconnect());
