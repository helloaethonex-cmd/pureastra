import { Request, Response, NextFunction } from "express";
import { auth } from "./better-auth";
import { prisma } from "../../lib/prisma";

const ROLE_CACHE_TTL_MS = 60_000;
const roleCache = new Map<string, { roleName: string; expiresAt: number }>();

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

    const cached = roleCache.get(user.id);
    if (cached && cached.expiresAt > Date.now()) {
      if (cached.roleName !== roleName) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      return next();
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      include: { role: true },
    });

    roleCache.set(user.id, {
      roleName: dbUser?.role?.name ?? "",
      expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    });

    if (dbUser?.role?.name !== roleName) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
};
