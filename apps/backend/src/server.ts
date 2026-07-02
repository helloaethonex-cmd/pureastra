(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import * as Sentry from "@sentry/node";
import { Server } from "http";
import app from "./app";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const PORT = env.PORT || 5050;
let server: Server | null = null;
let isShuttingDown = false;

const shutdown = async (signal: string, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutdown initiated");

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    await prisma.$disconnect();
    logger.info({ signal }, "Shutdown complete");
    process.exit(exitCode);
  } catch (error) {
    logger.error({ err: error, signal }, "Shutdown failed");
    process.exit(1);
  }
};

server = app.listen(PORT, async () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, "HTTP server started");

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connectivity check passed");
  } catch (error) {
    logger.error({ err: error }, "Database connectivity check failed");
  }
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
  Sentry.captureException(reason);
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception");
  Sentry.captureException(error);
  void shutdown("uncaughtException", 1);
});
