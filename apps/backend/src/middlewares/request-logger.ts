import { NextFunction, Request, Response } from "express";
import pinoHttp from "pino-http";
import { logger, resolveRequestId } from "../lib/logger";

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      userId: req.user?.id?.toString(),
      remoteAddress:
        req.socket?.remoteAddress ??
        (req as any).raw?.socket?.remoteAddress ??
        (req as any).connection?.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  genReqId: (req, res) => {
    const requestId = resolveRequestId(req.headers["x-request-id"] as string | undefined);
    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode === 429) return "warn";
    if (res.statusCode >= 400) return "info";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.method === "OPTIONS" || req.url === "/api/v1/health",
  },
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  httpLogger(req, res);
  req.requestId = req.id !== undefined ? String(req.id) : undefined;
  next();
};
