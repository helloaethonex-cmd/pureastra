import { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors/app-error";
import { logger } from "../lib/logger";

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    requestId: req.requestId,
    path: req.originalUrl,
  });
};

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const log = req.log ?? logger;

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      requestId: req.requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request payload",
      code: "VALIDATION_ERROR",
      details: err.issues,
      requestId: req.requestId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2034") {
      return res.status(409).json({
        error: "Concurrency conflict, please retry",
        code: "CONCURRENCY_CONFLICT",
        requestId: req.requestId,
      });
    }

    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate resource conflict, please retry",
        code: "DUPLICATE_CONFLICT",
        requestId: req.requestId,
      });
    }
  }

  log.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    },
    "Unhandled request error",
  );

  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    requestId: req.requestId,
  });
};
