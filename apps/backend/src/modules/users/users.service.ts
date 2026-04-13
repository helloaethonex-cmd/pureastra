import { findUserById, updateUserById } from "./users.repository";

export const getUserById = async (id: string) => {
    return findUserById(BigInt(id));
}

export const updateUser = async (
    id: string,
    data: { name?: string; firstName?: string; lastName?: string; phone?: string },
) => {
    return updateUserById(BigInt(id), data);
}