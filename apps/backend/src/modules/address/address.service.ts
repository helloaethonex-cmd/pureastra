import {
  findAddressesByUser,
  findAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./address.repository";
import { CreateAddressInput, UpdateAddressInput } from "./address.types";

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getUserAddresses = async (userId: string) => {
  return findAddressesByUser(BigInt(userId));
};

export const getUserAddress = async (id: string, userId: string) => {
  const address = await findAddressById(BigInt(id));
  if (!address) throw { status: 404, message: "Address not found" };
  if (address.userId !== BigInt(userId)) throw { status: 403, message: "Forbidden" };
  return address;
};

export const createUserAddress = async (userId: string, data: CreateAddressInput) => {
  return createAddress(BigInt(userId), data);
};

export const updateUserAddress = async (id: string, userId: string, data: UpdateAddressInput) => {
  await getUserAddress(id, userId); // ownership check
  return updateAddress(BigInt(id), BigInt(userId), data);
};

export const deleteUserAddress = async (id: string, userId: string) => {
  await getUserAddress(id, userId); // ownership check
  return deleteAddress(BigInt(id));
};

export const makeDefaultAddress = async (id: string, userId: string) => {
  await getUserAddress(id, userId); // ownership check
  return setDefaultAddress(BigInt(id), BigInt(userId));
};
