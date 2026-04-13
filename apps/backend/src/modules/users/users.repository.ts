import { prisma } from "../../lib/prisma";

export const findUserById = async (id: bigint) => {
    return prisma.user.findUnique({
        where: { id: id },
        include: { role: true }
    });
}

export const updateUserById = async (
    id: bigint,
    data: { name?: string; firstName?: string; lastName?: string; phone?: string },
) => {
    return prisma.user.update({
        where: { id },
        data,
        include: { role: true },
    });
}