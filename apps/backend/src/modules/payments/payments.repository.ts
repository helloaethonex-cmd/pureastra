import { Prisma } from "../../generated/prisma/client";

export type TxClient = Prisma.TransactionClient;

export const findOrderForUser = (tx: TxClient, orderId: bigint, userId: bigint) => {
  return tx.order.findFirst({
    where: { id: orderId, userId },
  });
};

export const findPaymentAttemptByOrderAndIdempotencyKey = (
  tx: TxClient,
  orderId: bigint,
  idempotencyKey: string,
) => {
  return tx.payment.findFirst({
    where: { orderId, idempotencyKey },
  });
};

export const findSuccessfulPaymentForOrder = (tx: TxClient, orderId: bigint) => {
  return tx.payment.findFirst({
    where: { orderId, paymentStatus: 1 },
  });
};

export const createPaymentAttempt = (tx: TxClient, data: Prisma.PaymentCreateInput) => {
  return tx.payment.create({ data });
};

export const findPaymentByIdWithOrder = (tx: TxClient, paymentId: bigint) => {
  return tx.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });
};

export const findPaymentByProviderOrderId = (tx: TxClient, providerOrderId: string) => {
  return tx.payment.findFirst({
    where: { providerOrderId },
    include: { order: true },
  });
};

export const findPaymentByProviderPaymentId = (
  tx: TxClient,
  providerPaymentId: string,
) => {
  return tx.payment.findFirst({
    where: { providerPaymentId },
    include: { order: true },
  });
};

export const findPaymentByProviderEventId = (tx: TxClient, providerEventId: string) => {
  return tx.payment.findFirst({
    where: { providerEventId },
    include: { order: true },
  });
};

export const updatePayment = (
  tx: TxClient,
  paymentId: bigint,
  data: Prisma.PaymentUpdateInput,
) => {
  return tx.payment.update({
    where: { id: paymentId },
    data,
    include: { order: true },
  });
};

export const updateOrderForPaymentSuccess = (
  tx: TxClient,
  orderId: bigint,
  data: Prisma.OrderUpdateInput,
) => {
  return tx.order.update({
    where: { id: orderId },
    data,
  });
};

export const confirmReservationsByOrder = (tx: TxClient, orderId: bigint) => {
  return tx.inventoryReservation.updateMany({
    where: { orderId, status: 0 },
    data: { status: 1 },
  });
};

export const createOrderStatusHistory = (
  tx: TxClient,
  data: Prisma.OrderStatusHistoryCreateInput,
) => {
  return tx.orderStatusHistory.create({ data });
};
