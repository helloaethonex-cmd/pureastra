import { Request, Response, NextFunction } from "express";
import { auth } from "./better-auth";
import { prisma } from "../../lib/prisma";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: req.headers as any
    })

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    (req as any).user = session.user;
    (req as any).session = session.session;
    next();
}

export const requireRole = (roleName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: "Unauthorized" })
            return
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: BigInt(user.id) },
            include: { role: true }
        });

        if (dbUser?.role?.name !== roleName) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        next();
    }
}