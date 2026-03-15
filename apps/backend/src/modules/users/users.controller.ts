import { Request, Response } from "express";
import { getUserById } from "./users.service";

export const getMe = async (req: Request, res: Response) => {
    const user = (req as any).user;

    const dbUser = await getUserById(user.id);
    res.status(200).json(dbUser);
}