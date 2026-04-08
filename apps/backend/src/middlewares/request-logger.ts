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
  // pino-http v11 types only declare 3 args but runtime supports 4 (responseTime).
  // Cast to any to bypass the stale type definition.
  customLogLevel: ((_req: any, res: any, err: any, responseTime: number) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode === 429) return "warn";
    if (res.statusCode >= 400) return "warn";
    if (responseTime > 3000) return "warn"; // slow request — log even on success
    return "silent";
  }) as any,
  autoLogging: {
    ignore: (req) => {
      const url = req.url ?? "";

      // Skip preflight and health checks
      if (req.method === "OPTIONS") return true;
      if (url === "/api/v1/health") return true;

      // Silently drop all scanner/bot probes.
      // Anything not under a known valid prefix is guaranteed noise:
      // PHP exploits, path traversal, Docker API scans, ThinkPHP RCE, etc.
      const isKnownPath =
        url.startsWith("/api/") ||
        url.startsWith("/docs");

      return !isKnownPath;
    },
  },
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  httpLogger(req, res);
  req.requestId = req.id !== undefined ? String(req.id) : undefined;
  next();
};
