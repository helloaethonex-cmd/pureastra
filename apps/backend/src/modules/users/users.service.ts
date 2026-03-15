import { findUserById } from "./users.repository";

export const getUserById = async (id: string) => {
    return findUserById(BigInt(id));
}