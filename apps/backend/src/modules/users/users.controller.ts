import { Request, Response } from "express";
import { getUserById, updateUser } from "./users.service";
import { z } from "zod";

export const getMe = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const dbUser = await getUserById(user.id);
    res.status(200).json(dbUser);
}

const updateMeSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    firstName: z.string().min(1).max(60).optional(),
    lastName: z.string().min(1).max(60).optional(),
    phone: z.string().min(7).max(20).optional(),
});

export const updateMe = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const parsed = updateMeSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
        }

        const updated = await updateUser(user.id, parsed.data);
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message ?? "Failed to update profile" });
    }
}