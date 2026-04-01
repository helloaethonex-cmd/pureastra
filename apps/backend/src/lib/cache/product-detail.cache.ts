import { logger } from "../logger";

const PRODUCT_CACHE_PREFIX = "product-detail";
const PRODUCT_CACHE_TTL_SECONDS = 300;
const PRODUCT_CACHE_MAX_ENTRIES = 1000;

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry>();

const safeJsonStringify = (value: unknown) => {
  return JSON.stringify(value, (_key, raw) => (typeof raw === "bigint" ? raw.toString() : raw));
};

const now = () => Date.now();

const isExpired = (entry: CacheEntry) => entry.expiresAt <= now();

const pruneExpiredEntries = () => {
  for (const [key, entry] of cacheStore.entries()) {
    if (!isExpired(entry)) continue;
    cacheStore.delete(key);
  }
};

const enforceMaxSize = () => {
  while (cacheStore.size > PRODUCT_CACHE_MAX_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cacheStore.delete(oldestKey);
  }
};

const touchEntry = (key: string, entry: CacheEntry) => {
  cacheStore.delete(key);
  cacheStore.set(key, entry);
};

export const buildProductDetailCacheKey = (identifier: string) =>
  `${PRODUCT_CACHE_PREFIX}:${identifier}`;

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  try {
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (isExpired(entry)) {
      cacheStore.delete(key);
      return null;
    }

    touchEntry(key, entry);
    return JSON.parse(entry.value) as T;
  } catch (err) {
    logger.warn({ err, key }, "Failed to read value from in-memory cache");
    return null;
  }
};

export const setCachedJson = async (key: string, value: unknown, ttlSeconds = PRODUCT_CACHE_TTL_SECONDS) => {
  try {
    const expiresAt = now() + Math.max(ttlSeconds, 1) * 1000;
    const entry: CacheEntry = {
      value: safeJsonStringify(value),
      expiresAt,
    };

    touchEntry(key, entry);
    enforceMaxSize();
  } catch (err) {
    logger.warn({ err, key }, "Failed to write value to in-memory cache");
  }
};

export const deleteCachedKey = async (key: string) => {
  try {
    cacheStore.delete(key);
  } catch (err) {
    logger.warn({ err, key }, "Failed to delete in-memory cache key");
  }
};

setInterval(pruneExpiredEntries, 60_000).unref();
