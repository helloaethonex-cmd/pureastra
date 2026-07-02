import { logger } from "../logger";
import { redisClient } from "../redis/client";

const PRODUCT_CACHE_PREFIX = "product-detail";

export const PRODUCT_DETAIL_CACHE_TTL_SECONDS = 300;

const safeJsonStringify = (value: unknown) =>
  JSON.stringify(value, (_key, raw) => (typeof raw === "bigint" ? raw.toString() : raw));

export const buildProductDetailCacheKey = (identifier: string) =>
  `${PRODUCT_CACHE_PREFIX}:${identifier}`;

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ err, key }, "Failed to read value from Redis cache");
    return null;
  }
};

export const setCachedJson = async (key: string, value: unknown, ttlSeconds = PRODUCT_DETAIL_CACHE_TTL_SECONDS) => {
  try {
    await redisClient.set(key, safeJsonStringify(value), "EX", Math.max(ttlSeconds, 1));
  } catch (err) {
    logger.warn({ err, key }, "Failed to write value to Redis cache");
  }
};

export const deleteCachedKey = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.warn({ err, key }, "Failed to delete Redis cache key");
  }
};
