import { Request, Response, NextFunction } from "express";
import { auth } from "./better-auth";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis/client";
import { logger } from "../../lib/logger";

const ROLE_CACHE_PREFIX = "role:";
const ROLE_CACHE_TTL_SECONDS = 15;

const getRoleFromCache = async (userId: string): Promise<string | null> => {
  try {
    return await redisClient.get(`${ROLE_CACHE_PREFIX}${userId}`);
  } catch {
    return null;
  }
};

const setRoleInCache = async (userId: string, roleName: string): Promise<void> => {
  try {
    await redisClient.set(`${ROLE_CACHE_PREFIX}${userId}`, roleName, "EX", ROLE_CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err, userId }, "Failed to write role to Redis cache");
  }
};

export const invalidateRoleCache = async (userId: string): Promise<void> => {
  try {
    await redisClient.del(`${ROLE_CACHE_PREFIX}${userId}`);
  } catch (err) {
    logger.warn({ err, userId }, "Failed to delete role from Redis cache");
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = session.user;
  req.session = session.session;
  next();
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }
  } catch {
    // Best-effort auth hydration for mixed guest/auth routes.
  }

  next();
};

export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const cachedRole = await getRoleFromCache(user.id);
    if (cachedRole !== null) {
      if (cachedRole !== roleName) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      return next();
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      include: { role: true },
    });

    await setRoleInCache(user.id, dbUser?.role?.name ?? "");

    if (dbUser?.role?.name !== roleName) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
};
