import { prisma } from "../../lib/prisma";
import { CreateAddressInput, UpdateAddressInput } from "./address.types";

// ─── Addresses ────────────────────────────────────────────────────────────────

export const findAddressesByUser = async (userId: bigint) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

export const findAddressById = async (id: bigint) => {
  return prisma.address.findFirst({ where: { id } });
};

export const createAddress = async (userId: bigint, data: CreateAddressInput) => {
  // If this is marked as default, unset previous defaults first
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({ data: { ...data, userId } });
};

export const updateAddress = async (id: bigint, userId: bigint, data: UpdateAddressInput) => {
  // If setting as default, clear other defaults for this user
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({ where: { id }, data });
};

export const deleteAddress = async (id: bigint) => {
  return prisma.address.delete({ where: { id } });
};

export const setDefaultAddress = async (id: bigint, userId: bigint) => {
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
  return prisma.address.update({ where: { id }, data: { isDefault: true } });
};
