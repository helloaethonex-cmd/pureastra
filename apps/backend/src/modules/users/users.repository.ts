import { prisma } from "../../lib/prisma";

export const findUserById = async (id: bigint) => {
    return prisma.user.findUnique({
        where: { id: id },
        include: { role: true }
    });
}