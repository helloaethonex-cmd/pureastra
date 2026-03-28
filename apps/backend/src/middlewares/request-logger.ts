import { NextFunction, Request, Response } from "express";
import pinoHttp from "pino-http";
import { logger, resolveRequestId } from "../lib/logger";

const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const requestId = resolveRequestId(req.headers["x-request-id"] as string | undefined);
    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/api/v1/health",
  },
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  httpLogger(req, res);
  req.requestId = req.id !== undefined ? String(req.id) : undefined;
  next();
};
