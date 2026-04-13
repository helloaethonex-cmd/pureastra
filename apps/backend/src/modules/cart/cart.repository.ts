import { prisma } from "../../lib/prisma";
import { Prisma } from "../../generated/prisma/client";
import { AddCartItemInput, UpdateCartItemInput } from "./cart.types";
import { AppError } from "../../lib/errors/app-error";

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
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { position: "asc" as const } },
            },
          },
          images: { take: 1, orderBy: { position: "asc" as const } },
        },
      },
    },
  },
} as const;

// ─── Cart ─────────────────────────────────────────────────────────────────────

/** Returns the existing active cart for a user (or session), or creates a new one. */
export const findOrCreateCart = async (userId?: bigint, sessionId?: string) => {
  if (!userId && !sessionId) {
    throw new Error("Either userId or sessionId is required");
  }

  if (userId) {
    const existingUserCart = await prisma.cart.findFirst({
      where: { userId, status: CART_STATUS.ACTIVE },
      include: cartFullInclude,
    });

    if (existingUserCart) {
      // Hotfix: enforce single-owner cart model (user cart must not keep sessionId).
      if (existingUserCart.sessionId) {
        return prisma.cart.update({
          where: { id: existingUserCart.id },
          data: { sessionId: null },
          include: cartFullInclude,
        });
      }
      return existingUserCart;
    }

    return prisma.cart.create({
      data: {
        status: CART_STATUS.ACTIVE,
        userId,
      },
      include: cartFullInclude,
    });
  }

  const existingGuestCart = await prisma.cart.findFirst({
    where: { sessionId, status: CART_STATUS.ACTIVE, userId: null },
    include: cartFullInclude,
  });
  if (existingGuestCart) return existingGuestCart;

  return prisma.cart.create({
    data: {
      status: CART_STATUS.ACTIVE,
      sessionId,
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

export const findActiveCartByUserId = async (userId: bigint) => {
  return prisma.cart.findFirst({
    where: { userId, status: CART_STATUS.ACTIVE },
    include: cartFullInclude,
  });
};

export const findActiveCartBySessionId = async (sessionId: string) => {
  return prisma.cart.findFirst({
    where: { sessionId, status: CART_STATUS.ACTIVE },
    include: cartFullInclude,
  });
};

// ─── Cart Items ───────────────────────────────────────────────────────────────

/** Adds an item to the cart. If the variant already exists, increments quantity. */
export const upsertCartItem = async (
  cartId: bigint,
  data: AddCartItemInput,
) => {
  const variant = await prisma.productVariant.findFirst({
    where: { id: data.productVariantId, deletedAt: null },
  });
  if (!variant) {
    throw new AppError(404, "Product variant not found", "PRODUCT_VARIANT_NOT_FOUND");
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productVariantId: data.productVariantId },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + data.quantity,
        priceSnapshot: variant.price,
      },
      include: {
        productVariant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1, orderBy: { position: "asc" as const } },
              },
            },
          },
        },
      },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId,
      productVariantId: data.productVariantId,
      quantity: data.quantity,
      priceSnapshot: variant.price,
    },
    include: {
      productVariant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { position: "asc" as const } },
            },
          },
        },
      },
    },
  });
};

export const updateCartItemQuantityForUser = async (
  itemId: bigint,
  userId: bigint,
  data: UpdateCartItemInput,
) => {
  const existing = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        userId,
        status: CART_STATUS.ACTIVE,
      },
    },
  });

  if (!existing) return null;

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity },
    include: {
      productVariant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { position: "asc" as const } },
            },
          },
        },
      },
    },
  });
};

export const updateCartItemQuantityForSession = async (
  itemId: bigint,
  sessionId: string,
  data: UpdateCartItemInput,
) => {
  const existing = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        sessionId,
        status: CART_STATUS.ACTIVE,
      },
    },
  });

  if (!existing) return null;

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity },
    include: {
      productVariant: {
        include: { product: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
};

export const removeCartItemForUser = async (itemId: bigint, userId: bigint) => {
  const deleted = await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cart: {
        userId,
        status: CART_STATUS.ACTIVE,
      },
    },
  });

  return deleted.count > 0;
};

export const removeCartItemForSession = async (
  itemId: bigint,
  sessionId: string,
) => {
  const deleted = await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cart: {
        sessionId,
        status: CART_STATUS.ACTIVE,
      },
    },
  });

  return deleted.count > 0;
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
    where: { sessionId, status: CART_STATUS.ACTIVE, userId: null },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return null;

  return prisma.$transaction(async (tx) => {
    const existingUserCart = await tx.cart.findFirst({
      where: { userId, status: CART_STATUS.ACTIVE },
      include: cartFullInclude,
    });

    const userCart =
      (existingUserCart
        ? existingUserCart.sessionId
          ? await tx.cart.update({
              where: { id: existingUserCart.id },
              data: { sessionId: null },
              include: cartFullInclude,
            })
          : existingUserCart
        : null) ??
      (await tx.cart.create({
        data: {
          userId,
          status: CART_STATUS.ACTIVE,
        },
        include: cartFullInclude,
      }));

    const guestGrouped = new Map<
      string,
      { productVariantId: bigint; quantity: number; priceSnapshot: typeof guestCart.items[number]["priceSnapshot"] }
    >();

    for (const guestItem of guestCart.items) {
      const key = guestItem.productVariantId.toString();
      const existing = guestGrouped.get(key);
      if (existing) {
        existing.quantity += guestItem.quantity;
        if (!existing.priceSnapshot && guestItem.priceSnapshot) {
          existing.priceSnapshot = guestItem.priceSnapshot;
        }
      } else {
        guestGrouped.set(key, {
          productVariantId: guestItem.productVariantId,
          quantity: guestItem.quantity,
          priceSnapshot: guestItem.priceSnapshot,
        });
      }
    }

    const groupedRows = [...guestGrouped.values()];
    const variantIds = groupedRows.map((row) => row.productVariantId);

    const existingItems = await tx.cartItem.findMany({
      where: {
        cartId: userCart.id,
        productVariantId: { in: variantIds },
      },
      select: { id: true, productVariantId: true },
    });

    const existingMap = new Map(existingItems.map((item) => [item.productVariantId.toString(), item.id]));
    const rowsToCreate = groupedRows.filter((row) => !existingMap.has(row.productVariantId.toString()));
    const rowsToIncrement = groupedRows.filter((row) => existingMap.has(row.productVariantId.toString()));

    if (rowsToCreate.length > 0) {
      await tx.cartItem.createMany({
        data: rowsToCreate.map((row) => ({
          cartId: userCart.id,
          productVariantId: row.productVariantId,
          quantity: row.quantity,
          priceSnapshot: row.priceSnapshot ?? null,
        })),
      });
    }

    if (rowsToIncrement.length > 0) {
      await tx.$executeRaw`
        UPDATE "cart_items" AS ci
        SET "quantity" = ci."quantity" + data."quantity",
            "updated_at" = NOW()
        FROM (
          VALUES ${Prisma.join(
            rowsToIncrement.map(
              (row) =>
                Prisma.sql`(${existingMap.get(
                  row.productVariantId.toString(),
                )!}::bigint, ${row.quantity}::integer)`,
            ),
          )}
        ) AS data("id", "quantity")
        WHERE ci."id" = data."id"
      `;
    }

    await tx.cart.update({
      where: { id: guestCart.id },
      data: { status: CART_STATUS.ABANDONED, abandonedAt: new Date() },
    });

    return tx.cart.findFirst({
      where: { id: userCart.id },
      include: cartFullInclude,
    });
  });
};
