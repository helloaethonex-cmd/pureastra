import crypto from "crypto";
import { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis/client";
import { AppError } from "../../lib/errors/app-error";
import { logger } from "../../lib/logger";
import { ORDER_STATUS, PAYMENT_STATUS, INVENTORY_RESERVATION_STATUS } from "../orders/orders.types";
import { findActiveInfluencerByCode } from "../influencers/influencers.repository";
import { ensureProviderOrderForPaymentAttempt } from "../payments/payments.service";
import {
  createInventoryReservations,
  createOrder,
  createOrderItems,
  createOrderStatusHistory,
  createPaymentAttempt,
  findActiveCartForCheckout,
  findAddressForCheckout,
  findVariantForBuyNowCheckout,
  incrementOrderNumberSequence,
  incrementVariantStockReservedBulk,
  markCartCheckedOut,
  TxClient,
} from "./checkout.repository";
import {
  CHECKOUT_FLOW,
  CheckoutConfirmInput,
  CheckoutFlow,
  CheckoutPreviewInput,
  CheckoutPreviewRecord,
  BuyNowPreviewInput,
} from "./checkout.types";

const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10000,
} as const;

const PREVIEW_KEY_PREFIX = "checkout:preview:";
const IDEMPOTENCY_KEY_PREFIX = "checkout:idempotency:";
const PREVIEW_LOCK_PREFIX = "checkout:confirm-lock:";
const PREVIEW_VERSION = 1 as const;
const PREVIEW_CONSUME_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local value = redis.call('GET', key)
if not value then
  return '__MISSING__'
end
local decoded = cjson.decode(value)
if decoded['consumedAt'] ~= cjson.null and decoded['consumedAt'] ~= nil then
  return '__CONSUMED__'
end
if tonumber(decoded['expiresAt']) <= now then
  return '__EXPIRED__'
end
decoded['consumedAt'] = now
local encoded = cjson.encode(decoded)
redis.call('SET', key, encoded, 'PXAT', tonumber(decoded['expiresAt']))
return encoded
`;

const SHIPPING_AMOUNT_CENTS = 0;
const TAX_AMOUNT_CENTS = 0;
const DISCOUNT_AMOUNT_CENTS = 0;

type PreparedLineItem = {
  productVariantId: bigint;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type CheckoutIdempotencyRecord = {
  orderId: string;
  paymentId: string;
  providerOrderId: string | null;
  couponCode: string | null;
  responsePayload: CheckoutConfirmResponse | null;
  httpStatus: number | null;
  createdAt: number;
};

type CheckoutConfirmResponse = {
  order: {
    id: string;
    orderNumber: string;
    orderStatus: number;
    paymentStatus: number;
    totalPaid: string;
    createdAt: string;
  };
  payment: {
    id: string;
    orderId: string;
    paymentProvider: string;
    amount: string;
    currency: string;
    paymentStatus: number;
    paymentAttemptId: string;
    razorpayOrderId: string | null;
    amountPaise: number;
    razorpayKeyId: string;
    createdAt: string;
  };
  coupon: {
    couponStatus: "NOT_IMPLEMENTED";
    couponDiscountAmount: "0.00";
    couponMessage: string;
  };
};

const toCents = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const amount = typeof value === "number" ? value : value.toNumber();
  return Math.round(amount * 100);
};

const centsToDecimal = (cents: number) =>
  new Prisma.Decimal((cents / 100).toFixed(2));

const centsToString = (cents: number) => (cents / 100).toFixed(2);

const formatOrderNumber = (year: number, sequence: number) =>
  `PA-${year}-${String(sequence).padStart(6, "0")}`;

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const couponPlaceholder = (couponCode?: string | null) => ({
  couponStatus: "NOT_IMPLEMENTED" as const,
  couponDiscountAmount: "0.00" as const,
  couponMessage: couponCode
    ? `Coupon "${couponCode}" is not available in this phase yet.`
    : "Coupon system is not available in this phase yet.",
});

const previewKey = (token: string) => `${PREVIEW_KEY_PREFIX}${token}`;
const idempotencyKey = (userId: string, flow: CheckoutFlow, key: string) =>
  `${IDEMPOTENCY_KEY_PREFIX}${userId}:${flow}:${key}`;
const previewLockKey = (token: string) => `${PREVIEW_LOCK_PREFIX}${token}`;

const hashPayload = (payload: object) =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const groupByVariant = (items: Array<{ productVariantId: bigint; quantity: number }>) => {
  const map = new Map<string, { productVariantId: bigint; quantity: number }>();
  for (const item of items) {
    const key = item.productVariantId.toString();
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }
    map.set(key, { productVariantId: item.productVariantId, quantity: item.quantity });
  }
  return [...map.values()];
};

const buildPreparedLineItems = (
  rows: Array<{
    productVariantId: bigint;
    quantity: number;
    priceSnapshot: Prisma.Decimal | null;
    productVariant: {
      id: bigint;
      variantName: string | null;
      sku: string | null;
      price: Prisma.Decimal | null;
      stockQuantity: number | null;
      stockReserved: number;
      isActive: boolean;
      deletedAt: Date | null;
      product: { name: string };
    };
  }>,
) => {
  const items: PreparedLineItem[] = [];

  for (const row of rows) {
    const variant = row.productVariant;
    if (!variant.isActive || variant.deletedAt) {
      throw new AppError(409, "One or more cart variants are unavailable", "VARIANT_UNAVAILABLE");
    }

    const available = (variant.stockQuantity ?? 0) - variant.stockReserved;
    if (available < row.quantity) {
      throw new AppError(
        409,
        `Insufficient stock for variant ${variant.id.toString()}`,
        "INSUFFICIENT_STOCK",
      );
    }

    const unitPriceCents = toCents(row.priceSnapshot ?? variant.price);
    if (unitPriceCents <= 0) {
      throw new AppError(400, "Invalid product price", "INVALID_PRICE");
    }

    items.push({
      productVariantId: row.productVariantId,
      productName: variant.product.name,
      variantName: variant.variantName,
      sku: variant.sku,
      quantity: row.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * row.quantity,
    });
  }

  return items.sort((a, b) => a.productVariantId.toString().localeCompare(b.productVariantId.toString()));
};

const buildBuyNowPreparedLineItem = (
  variant: {
    id: bigint;
    variantName: string | null;
    sku: string | null;
    price: Prisma.Decimal | null;
    stockQuantity: number | null;
    stockReserved: number;
    isActive: boolean;
    deletedAt: Date | null;
    product: { name: string; deletedAt: Date | null; isActive: boolean };
  },
  quantity: number,
): PreparedLineItem => {
  if (!variant.isActive || variant.deletedAt || !variant.product.isActive || variant.product.deletedAt) {
    throw new AppError(409, "Variant is unavailable for buy-now", "VARIANT_UNAVAILABLE");
  }

  const available = (variant.stockQuantity ?? 0) - variant.stockReserved;
  if (available < quantity) {
    throw new AppError(409, "Insufficient stock", "INSUFFICIENT_STOCK");
  }

  const unitPriceCents = toCents(variant.price);
  if (unitPriceCents <= 0) {
    throw new AppError(400, "Invalid product price", "INVALID_PRICE");
  }

  return {
    productVariantId: variant.id,
    productName: variant.product.name,
    variantName: variant.variantName,
    sku: variant.sku,
    quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * quantity,
  };
};

const buildTotals = (items: PreparedLineItem[]) => {
  const productTotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const grandTotalCents =
    productTotalCents + SHIPPING_AMOUNT_CENTS + TAX_AMOUNT_CENTS - DISCOUNT_AMOUNT_CENTS;

  return {
    productTotalCents,
    shippingAmountCents: SHIPPING_AMOUNT_CENTS,
    taxAmountCents: TAX_AMOUNT_CENTS,
    discountAmountCents: DISCOUNT_AMOUNT_CENTS,
    grandTotalCents,
    outstandingCents: grandTotalCents,
  };
};

const buildPreviewResponse = (
  input: {
    flowType: CheckoutFlow;
    couponCode: string | null;
    token: string;
    expiresAt: number;
  },
  items: PreparedLineItem[],
) => {
  const totals = buildTotals(items);

  return {
    flowType: input.flowType,
    items: items.map((item) => ({
      productVariantId: item.productVariantId.toString(),
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: centsToString(item.unitPriceCents),
      lineTotal: centsToString(item.lineTotalCents),
    })),
    totals: {
      productTotal: centsToString(totals.productTotalCents),
      shippingAmount: centsToString(totals.shippingAmountCents),
      taxAmount: centsToString(totals.taxAmountCents),
      discountAmount: centsToString(totals.discountAmountCents),
      grandTotal: centsToString(totals.grandTotalCents),
      outstandingAmount: centsToString(totals.outstandingCents),
    },
    ...couponPlaceholder(input.couponCode),
    previewToken: input.token,
    expiresAt: new Date(input.expiresAt).toISOString(),
  };
};

const savePreview = async (token: string, record: CheckoutPreviewRecord) => {
  const ttlMs = Math.max(record.expiresAt - Date.now(), 1);
  await redisClient.set(previewKey(token), JSON.stringify(record), "PX", ttlMs);
};

const consumePreviewAtomic = async (token: string) => {
  const now = Date.now();
  const result = await redisClient.eval(
    PREVIEW_CONSUME_LUA,
    1,
    previewKey(token),
    now.toString(),
  );

  if (result === "__MISSING__") {
    throw new AppError(400, "Preview token is invalid or expired", "PREVIEW_TOKEN_INVALID");
  }
  if (result === "__CONSUMED__") {
    throw new AppError(409, "Preview token already consumed", "PREVIEW_TOKEN_CONSUMED");
  }
  if (result === "__EXPIRED__") {
    throw new AppError(400, "Preview token expired", "PREVIEW_TOKEN_EXPIRED");
  }
  if (typeof result !== "string") {
    throw new AppError(500, "Failed to consume preview token", "PREVIEW_TOKEN_CONSUME_FAILED");
  }

  const parsed = JSON.parse(result) as CheckoutPreviewRecord;
  if (parsed.expiresAt <= now) {
    throw new AppError(400, "Preview token expired", "PREVIEW_TOKEN_EXPIRED");
  }

  return parsed;
};

const loadIdempotencyRecord = async (key: string) => {
  const raw = await redisClient.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as CheckoutIdempotencyRecord;
};

const saveIdempotencyRecord = async (
  key: string,
  record: CheckoutIdempotencyRecord,
) => {
  await redisClient.set(
    key,
    JSON.stringify(record),
    "EX",
    env.CHECKOUT_IDEMPOTENCY_TTL_SECONDS,
  );
};

const buildCartHashSource = (
  previewInput: CheckoutPreviewInput,
  cart: NonNullable<Awaited<ReturnType<typeof findActiveCartForCheckout>>>,
) => {
  const items = buildPreparedLineItems(cart.items);

  return {
    request: {
      addressId: previewInput.addressId.toString(),
      note: normalizeOptionalText(previewInput.note),
      couponCode: normalizeOptionalText(previewInput.couponCode),
      referralCode: normalizeOptionalText(previewInput.referralCode),
    },
    cartId: cart.id.toString(),
    flowType: CHECKOUT_FLOW.CART,
    items: items.map((item) => ({
      productVariantId: item.productVariantId.toString(),
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  };
};

const buildBuyNowHashSource = (
  previewInput: BuyNowPreviewInput,
  variant: NonNullable<Awaited<ReturnType<typeof findVariantForBuyNowCheckout>>>,
) => {
  const item = buildBuyNowPreparedLineItem(variant, previewInput.quantity);

  return {
    request: {
      addressId: previewInput.addressId.toString(),
      note: normalizeOptionalText(previewInput.note),
      couponCode: normalizeOptionalText(previewInput.couponCode),
      referralCode: normalizeOptionalText(previewInput.referralCode),
      productVariantId: previewInput.productVariantId.toString(),
      quantity: previewInput.quantity,
    },
    flowType: CHECKOUT_FLOW.BUY_NOW,
    items: [
      {
        productVariantId: item.productVariantId.toString(),
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      },
    ],
  };
};

const createOrderAndPaymentInTx = async (
  tx: TxClient,
  userId: bigint,
  flow: CheckoutFlow,
  request: CheckoutPreviewRecord["request"],
) => {
  const now = new Date();
  const addressId = BigInt(request.addressId);
  const address = await findAddressForCheckout(tx, userId, addressId);
  if (!address) {
    throw new AppError(400, "Invalid address", "ADDRESS_INVALID");
  }

  let lineItems: PreparedLineItem[] = [];
  let cartIdForCheckout: bigint | null = null;

  if (flow === CHECKOUT_FLOW.CART) {
    const cart = await findActiveCartForCheckout(tx, userId);
    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "Active cart is empty", "CART_EMPTY");
    }
    cartIdForCheckout = cart.id;
    lineItems = buildPreparedLineItems(cart.items);
  } else {
    const productVariantId = request.productVariantId ? BigInt(request.productVariantId) : null;
    const quantity = request.quantity;
    if (!productVariantId || !quantity) {
      throw new AppError(400, "Invalid buy-now payload", "BUY_NOW_PAYLOAD_INVALID");
    }

    const variant = await findVariantForBuyNowCheckout(tx, productVariantId);
    if (!variant) {
      throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
    }
    lineItems = [buildBuyNowPreparedLineItem(variant, quantity)];
  }

  if (lineItems.length === 0) {
    throw new AppError(400, "Checkout has no items", "CHECKOUT_EMPTY");
  }

  // Referral attribution is best-effort and never blocks checkout.
  let influencerId: bigint | undefined;
  let referralCode: string | undefined;
  if (request.referralCode) {
    const influencer = await findActiveInfluencerByCode(
      tx,
      request.referralCode.toUpperCase(),
    );
    if (influencer) {
      influencerId = influencer.id;
      referralCode = influencer.referralCode;
    }
  }

  const totals = buildTotals(lineItems);
  const year = now.getFullYear();
  const sequence = await incrementOrderNumberSequence(tx, year);
  const order = await createOrder(tx, {
    user: { connect: { id: userId } },
    orderNumber: formatOrderNumber(year, sequence.lastValue),
    shippingName: address.fullName,
    shippingPhone: address.phone,
    shippingLine1: address.line1,
    shippingLine2: address.line2,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPostalCode: address.postalCode,
    shippingCountry: address.country,
    productTotal: centsToDecimal(totals.productTotalCents),
    shippingAmount: centsToDecimal(totals.shippingAmountCents),
    taxAmount: centsToDecimal(totals.taxAmountCents),
    discountAmount: centsToDecimal(totals.discountAmountCents),
    totalPaid: centsToDecimal(0),
    orderStatus: ORDER_STATUS.PLACED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    placedAt: now,

    ...(influencerId && {
      influencer: { connect: { id: influencerId } },
      referralCode,
    }),
  });

  await createOrderItems(
    tx,
    lineItems.map((item) => ({
      orderId: order.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      priceAtPurchase: centsToDecimal(item.unitPriceCents),
      costPriceAtPurchase: centsToDecimal(0),
    })),
  );

  const expiresAt = new Date(now.getTime() + env.ORDER_RESERVATION_TTL_MINUTES * 60 * 1000);
  await createInventoryReservations(
    tx,
    lineItems.map((item) => ({
      productVariantId: item.productVariantId,
      orderId: order.id,
      cartId: cartIdForCheckout,
      quantity: item.quantity,
      status: INVENTORY_RESERVATION_STATUS.ACTIVE,
      expiresAt,
    })),
  );

  await incrementVariantStockReservedBulk(
    tx,
    groupByVariant(lineItems.map((item) => ({ productVariantId: item.productVariantId, quantity: item.quantity }))),
  );

  await createOrderStatusHistory(tx, {
    order: { connect: { id: order.id } },
    oldStatus: null,
    newStatus: ORDER_STATUS.PLACED,
    changedBy: userId,
    note: request.note ?? "Order placed",
  });

  if (flow === CHECKOUT_FLOW.CART && cartIdForCheckout) {
    await markCartCheckedOut(tx, cartIdForCheckout);
  }

  const payment = await createPaymentAttempt(tx, {
    order: { connect: { id: order.id } },
    paymentProvider: env.PAYMENT_PROVIDER_DEFAULT,
    paymentMethod: "razorpay",
    amount: centsToDecimal(totals.outstandingCents),
    paymentStatus: PAYMENT_STATUS.PENDING,
  });

  return { orderId: order.id, paymentId: payment.id };
};

const buildConfirmResponse = async (
  orderId: bigint,
  paymentResult: Awaited<ReturnType<typeof ensureProviderOrderForPaymentAttempt>>,
  couponCode: string | null,
): Promise<CheckoutConfirmResponse> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      orderStatus: true,
      paymentStatus: true,
      totalPaid: true,
      createdAt: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  return {
    order: {
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalPaid: order.totalPaid.toString(),
      createdAt: order.createdAt.toISOString(),
    },
    payment: paymentResult,
    coupon: couponPlaceholder(couponCode),
  };
};

const withConfirmLock = async <T>(previewToken: string, operation: () => Promise<T>) => {
  const lockKey = previewLockKey(previewToken);
  const acquired = await redisClient.set(lockKey, "1", "PX", 30000, "NX");
  if (!acquired) {
    throw new AppError(409, "Checkout confirm already in progress", "CHECKOUT_CONFIRM_IN_PROGRESS");
  }

  try {
    return await operation();
  } finally {
    await redisClient.del(lockKey);
  }
};

export const previewCheckoutFromCart = async (
  userId: string,
  input: CheckoutPreviewInput,
) => {
  return prisma.$transaction(async (tx) => {
    const uid = BigInt(userId);
    const cart = await findActiveCartForCheckout(tx, uid);
    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "Active cart is empty", "CART_EMPTY");
    }

    const address = await findAddressForCheckout(tx, uid, input.addressId);
    if (!address) {
      throw new AppError(400, "Invalid address", "ADDRESS_INVALID");
    }

    const hashSource = buildCartHashSource(input, cart);
    const payloadHash = hashPayload(hashSource);
    const previewToken = crypto.randomUUID();
    const expiresAt = Date.now() + env.CHECKOUT_PREVIEW_TTL_SECONDS * 1000;
    const record: CheckoutPreviewRecord = {
      version: PREVIEW_VERSION,
      userId,
      flowType: CHECKOUT_FLOW.CART,
      payloadHash,
      expiresAt,
      consumedAt: null,
      request: {
        addressId: input.addressId.toString(),
        note: normalizeOptionalText(input.note),
        couponCode: normalizeOptionalText(input.couponCode),
        referralCode: normalizeOptionalText(input.referralCode),
      },
    };

    await savePreview(previewToken, record);
    return buildPreviewResponse(
      {
        flowType: CHECKOUT_FLOW.CART,
        couponCode: record.request.couponCode,
        token: previewToken,
        expiresAt,
      },
      buildPreparedLineItems(cart.items),
    );
  }, TX_OPTIONS);
};

export const previewCheckoutBuyNow = async (
  userId: string,
  input: BuyNowPreviewInput,
) => {
  return prisma.$transaction(async (tx) => {
    const uid = BigInt(userId);
    const address = await findAddressForCheckout(tx, uid, input.addressId);
    if (!address) {
      throw new AppError(400, "Invalid address", "ADDRESS_INVALID");
    }

    const variant = await findVariantForBuyNowCheckout(tx, input.productVariantId);
    if (!variant) {
      throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
    }

    const hashSource = buildBuyNowHashSource(input, variant);
    const payloadHash = hashPayload(hashSource);
    const previewToken = crypto.randomUUID();
    const expiresAt = Date.now() + env.CHECKOUT_PREVIEW_TTL_SECONDS * 1000;
    const record: CheckoutPreviewRecord = {
      version: PREVIEW_VERSION,
      userId,
      flowType: CHECKOUT_FLOW.BUY_NOW,
      payloadHash,
      expiresAt,
      consumedAt: null,
      request: {
        addressId: input.addressId.toString(),
        note: normalizeOptionalText(input.note),
        couponCode: normalizeOptionalText(input.couponCode),
        referralCode: normalizeOptionalText(input.referralCode),
        productVariantId: input.productVariantId.toString(),
        quantity: input.quantity,
      },
    };

    await savePreview(previewToken, record);
    return buildPreviewResponse(
      {
        flowType: CHECKOUT_FLOW.BUY_NOW,
        couponCode: record.request.couponCode,
        token: previewToken,
        expiresAt,
      },
      [buildBuyNowPreparedLineItem(variant, input.quantity)],
    );
  }, TX_OPTIONS);
};

const confirmCheckoutByFlow = async (
  userId: string,
  flow: CheckoutFlow,
  input: CheckoutConfirmInput,
  idempotencyKeyHeader: string,
) => {
  const idemKey = idempotencyKey(userId, flow, idempotencyKeyHeader);

  return withConfirmLock(input.previewToken, async () => {
    const existingIdem = await loadIdempotencyRecord(idemKey);
    if (existingIdem?.responsePayload && existingIdem.httpStatus) {
      return {
        httpStatus: existingIdem.httpStatus,
        payload: existingIdem.responsePayload,
      };
    }

    if (existingIdem && !existingIdem.responsePayload) {
      const providerPayload = await ensureProviderOrderForPaymentAttempt(BigInt(existingIdem.paymentId));
      const payload = await buildConfirmResponse(
        BigInt(existingIdem.orderId),
        providerPayload,
        existingIdem.couponCode,
      );

      const nextRecord: CheckoutIdempotencyRecord = {
        ...existingIdem,
        providerOrderId: providerPayload.razorpayOrderId,
        responsePayload: payload,
        httpStatus: 201,
      };
      await saveIdempotencyRecord(idemKey, nextRecord);
      return { httpStatus: 201, payload };
    }

    const consumedPreview = await consumePreviewAtomic(input.previewToken);

    if (consumedPreview.userId !== userId) {
      throw new AppError(403, "Preview token does not belong to user", "PREVIEW_TOKEN_FORBIDDEN");
    }
    if (consumedPreview.flowType !== flow) {
      throw new AppError(409, "Preview flow mismatch", "PREVIEW_FLOW_MISMATCH");
    }

    const hashPayloadSource = await prisma.$transaction(async (tx) => {
      const uid = BigInt(userId);
      if (flow === CHECKOUT_FLOW.CART) {
        const cart = await findActiveCartForCheckout(tx, uid);
        if (!cart || cart.items.length === 0) {
          throw new AppError(400, "Active cart is empty", "CART_EMPTY");
        }

        const requestInput: CheckoutPreviewInput = {
          addressId: BigInt(consumedPreview.request.addressId),
          note: consumedPreview.request.note ?? undefined,
          couponCode: consumedPreview.request.couponCode ?? undefined,
          referralCode: consumedPreview.request.referralCode ?? undefined,
        };
        return buildCartHashSource(requestInput, cart);
      }

      const productVariantId = consumedPreview.request.productVariantId
        ? BigInt(consumedPreview.request.productVariantId)
        : null;
      const quantity = consumedPreview.request.quantity;
      if (!productVariantId || !quantity) {
        throw new AppError(400, "Invalid buy-now payload", "BUY_NOW_PAYLOAD_INVALID");
      }

      const variant = await findVariantForBuyNowCheckout(tx, productVariantId);
      if (!variant) {
        throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
      }

      const requestInput: BuyNowPreviewInput = {
        productVariantId,
        quantity,
        addressId: BigInt(consumedPreview.request.addressId),
        note: consumedPreview.request.note ?? undefined,
        couponCode: consumedPreview.request.couponCode ?? undefined,
        referralCode: consumedPreview.request.referralCode ?? undefined,
      };
      return buildBuyNowHashSource(requestInput, variant);
    }, TX_OPTIONS);

    const recomputedHash = hashPayload(hashPayloadSource);
    if (recomputedHash !== consumedPreview.payloadHash) {
      throw new AppError(409, "Checkout preview no longer matches current data", "PREVIEW_HASH_MISMATCH");
    }

    const createResult = await prisma.$transaction(
      (tx) => createOrderAndPaymentInTx(tx, BigInt(userId), flow, consumedPreview.request),
      TX_OPTIONS,
    );

    const interimRecord: CheckoutIdempotencyRecord = {
      orderId: createResult.orderId.toString(),
      paymentId: createResult.paymentId.toString(),
      providerOrderId: null,
      couponCode: consumedPreview.request.couponCode,
      responsePayload: null,
      httpStatus: null,
      createdAt: Date.now(),
    };
    await saveIdempotencyRecord(idemKey, interimRecord);

    let providerPayload: Awaited<ReturnType<typeof ensureProviderOrderForPaymentAttempt>>;
    try {
      providerPayload = await ensureProviderOrderForPaymentAttempt(createResult.paymentId);
    } catch (error) {
      logger.error(
        {
          err: error,
          orderId: createResult.orderId.toString(),
          paymentId: createResult.paymentId.toString(),
        },
        "Provider order creation failed after checkout commit",
      );
      throw new AppError(
        503,
        "Order created but payment provider is temporarily unavailable. Retry with the same Idempotency-Key.",
        "PAYMENT_PROVIDER_RETRYABLE",
      );
    }

    const payload = await buildConfirmResponse(
      createResult.orderId,
      providerPayload,
      consumedPreview.request.couponCode,
    );

    await saveIdempotencyRecord(idemKey, {
      ...interimRecord,
      providerOrderId: providerPayload.razorpayOrderId,
      responsePayload: payload,
      httpStatus: 201,
    });

    return { httpStatus: 201, payload };
  });
};

export const confirmCheckoutFromCart = async (
  userId: string,
  input: CheckoutConfirmInput,
  idempotencyKeyHeader: string,
) => confirmCheckoutByFlow(userId, CHECKOUT_FLOW.CART, input, idempotencyKeyHeader);

export const confirmCheckoutBuyNow = async (
  userId: string,
  input: CheckoutConfirmInput,
  idempotencyKeyHeader: string,
) => confirmCheckoutByFlow(userId, CHECKOUT_FLOW.BUY_NOW, input, idempotencyKeyHeader);
