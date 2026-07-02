import {
  findAddressesByUser,
  findAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./address.repository";
import { CreateAddressInput, UpdateAddressInput } from "./address.types";
import { AppError } from "../../lib/errors/app-error";
import { toStateCodeOrNull } from "../../utils/state";

const withNormalizedState = <T extends { state?: string }>(payload: T): T => {
  if (payload.state === undefined) {
    return payload;
  }

  const normalized = toStateCodeOrNull(payload.state);
  if (!normalized) {
    throw new AppError(400, "Invalid Indian state/UT", "INVALID_STATE");
  }

  return {
    ...payload,
    state: normalized,
  };
};

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getUserAddresses = async (userId: string) => {
  return findAddressesByUser(BigInt(userId));
};

export const getUserAddress = async (id: string, userId: string) => {
  const address = await findAddressById(BigInt(id));
  if (!address) throw new AppError(404, "Address not found", "ADDRESS_NOT_FOUND");
  if (address.userId !== BigInt(userId))
    throw new AppError(403, "Forbidden", "FORBIDDEN");
  return address;
};

export const createUserAddress = async (
  userId: string,
  data: CreateAddressInput,
) => {
  return createAddress(BigInt(userId), withNormalizedState(data));
};

export const updateUserAddress = async (
  id: string,
  userId: string,
  data: UpdateAddressInput,
) => {
  await getUserAddress(id, userId); // ownership check
  return updateAddress(BigInt(id), BigInt(userId), withNormalizedState(data));
};

export const deleteUserAddress = async (id: string, userId: string) => {
  await getUserAddress(id, userId); // ownership check
  return deleteAddress(BigInt(id));
};

export const makeDefaultAddress = async (id: string, userId: string) => {
  await getUserAddress(id, userId); // ownership check
  return setDefaultAddress(BigInt(id), BigInt(userId));
};
