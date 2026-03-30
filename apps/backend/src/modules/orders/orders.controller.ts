import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  placeOrder,
  updateOrderStatusByOrderNumber,
  listOrdersForAdmin,
  listOrdersForUser,
  getOrderDetailForUser,
} from "./orders.service";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  adminListOrdersSchema,
  userListOrdersSchema,
} from "./orders.types";

const handleError = (req: Request, res: Response, err: any) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Invalid request payload", details: err.issues });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2034") {
      return res
        .status(409)
        .json({ error: "Concurrent checkout conflict, please retry" });
    }
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Duplicate resource conflict, please retry" });
    }
  }

  req.log.error({ err }, "Order operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const input = createOrderSchema.parse(req.body);
    const order = await placeOrder(userId, input);

    return res.status(201).json(order);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderNumber } = req.params;
    if (typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Invalid order number" });
    }

    const input = updateOrderStatusSchema.parse(req.body);

    const updatedOrder = await updateOrderStatusByOrderNumber(
      orderNumber,
      userId,
      input,
    );

    return res.status(200).json(updatedOrder);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const input = adminListOrdersSchema.parse(req.query);
    const result = await listOrdersForAdmin(input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const input = userListOrdersSchema.parse(req.query);
    const result = await listOrdersForUser(userId, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getMyOrderDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderNumber } = req.params;
    if (typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Invalid order number" });
    }

    const result = await getOrderDetailForUser(userId, orderNumber);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};
