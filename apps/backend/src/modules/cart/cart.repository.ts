import { prisma } from "../../lib/prisma";
import { AddCartItemInput, UpdateCartItemInput } from "./cart.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CART_STATUS = {
  ACTIVE: 0,
  CHECKED_OUT: 1,
  ABANDONED: 2,
} as const;

const cartFullInclude = {
  items: {
    include: {
      productVariant: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { position: "asc" as const } },
        },
      },
    },
  },
} as const;

// ─── Cart ─────────────────────────────────────────────────────────────────────

/** Returns the existing active cart for a user (or session), or creates a new one. */
export const findOrCreateCart = async (userId?: bigint, sessionId?: string) => {
  const where = userId
    ? { userId, status: CART_STATUS.ACTIVE }
    : { sessionId, status: CART_STATUS.ACTIVE };

  const existing = await prisma.cart.findFirst({ where, include: cartFullInclude });
  if (existing) return existing;

  return prisma.cart.create({
    data: {
      status: CART_STATUS.ACTIVE,
      ...(userId ? { userId } : {}),
      ...(sessionId ? { sessionId } : {}),
    },
    include: cartFullInclude,
  });
};

export const findCartById = async (id: bigint) => {
  return prisma.cart.findFirst({
    where: { id },
    include: cartFullInclude,
  });
};

// ─── Cart Items ───────────────────────────────────────────────────────────────

/** Adds an item to the cart. If the variant already exists, increments quantity. */
export const upsertCartItem = async (cartId: bigint, data: AddCartItemInput) => {
  const variant = await prisma.productVariant.findFirst({
    where: { id: data.productVariantId, deletedAt: null },
  });
  if (!variant) throw { status: 404, message: "Product variant not found" };

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productVariantId: data.productVariantId },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + data.quantity, priceSnapshot: variant.price },
      include: { productVariant: { include: { product: { select: { id: true, name: true, slug: true } } } } },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId,
      productVariantId: data.productVariantId,
      quantity: data.quantity,
      priceSnapshot: variant.price,
    },
    include: { productVariant: { include: { product: { select: { id: true, name: true, slug: true } } } } },
  });
};

export const updateCartItemQuantity = async (itemId: bigint, data: UpdateCartItemInput) => {
  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity },
    include: { productVariant: { include: { product: { select: { id: true, name: true, slug: true } } } } },
  });
};

export const removeCartItem = async (itemId: bigint) => {
  return prisma.cartItem.delete({ where: { id: itemId } });
};

export const clearCartItems = async (cartId: bigint) => {
  return prisma.cartItem.deleteMany({ where: { cartId } });
};

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────

/**
 * Merges a guest (session-based) cart into the authenticated user's cart.
 * Items are upserted: existing variant quantities are incremented, new ones are inserted.
 * The guest cart is then marked as ABANDONED.
 */
export const mergeGuestCart = async (userId: bigint, sessionId: string) => {
  const guestCart = await prisma.cart.findFirst({
    where: { sessionId, status: CART_STATUS.ACTIVE },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return null;

  const userCart = await findOrCreateCart(userId);

  for (const guestItem of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productVariantId: guestItem.productVariantId },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productVariantId: guestItem.productVariantId,
          quantity: guestItem.quantity,
          priceSnapshot: guestItem.priceSnapshot,
        },
      });
    }
  }

  // Mark guest cart abandoned
  await prisma.cart.update({
    where: { id: guestCart.id },
    data: { status: CART_STATUS.ABANDONED, abandonedAt: new Date() },
  });

  return prisma.cart.findFirst({ where: { id: userCart.id }, include: cartFullInclude });
};
