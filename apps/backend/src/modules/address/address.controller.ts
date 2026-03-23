import { Request, Response } from "express";
import {
  getUserAddresses,
  getUserAddress,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  makeDefaultAddress,
} from "./address.service";
import { createAddressSchema, updateAddressSchema } from "./address.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const param = (req: Request, key: string): string => req.params[key] as string;

const handleError = (res: Response, err: any) => {
  if (err?.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};

// ─── Address Controllers ───────────────────────────────────────────────────────

/** GET /addresses */
export const listAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id.toString();
    const addresses = await getUserAddresses(userId);
    res.status(200).json(addresses);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /addresses/:id */
export const getAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id.toString();
    const address = await getUserAddress(param(req, "id"), userId);
    res.status(200).json(address);
  } catch (err) {
    handleError(res, err);
  }
};

/** POST /addresses */
export const createAddress = async (req: Request, res: Response) => {
  try {
    const data = createAddressSchema.parse(req.body);
    const userId = (req as any).user.id.toString();
    const address = await createUserAddress(userId, data);
    res.status(201).json(address);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /addresses/:id */
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const data = updateAddressSchema.parse(req.body);
    const userId = (req as any).user.id.toString();
    const address = await updateUserAddress(param(req, "id"), userId, data);
    res.status(200).json(address);
  } catch (err) {
    handleError(res, err);
  }
};

/** DELETE /addresses/:id */
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id.toString();
    await deleteUserAddress(param(req, "id"), userId);
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /addresses/:id/default */
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id.toString();
    const address = await makeDefaultAddress(param(req, "id"), userId);
    res.status(200).json(address);
  } catch (err) {
    handleError(res, err);
  }
};
