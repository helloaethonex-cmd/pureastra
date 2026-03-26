import { ConnectionOptions } from "bullmq";
import { RedisOptions } from "ioredis";
import { env } from "../../config/env";

const REDIS_MAX_RETRY_DELAY_MS = 2000;

const retryStrategy = (times: number) => Math.min(times * 50, REDIS_MAX_RETRY_DELAY_MS);

const reconnectOnError = (err: Error) => {
  if (err.message.includes("READONLY")) {
    return 1;
  }
  return false;
};

const withResilience = (options: RedisOptions): RedisOptions => ({
  ...options,
  maxRetriesPerRequest: null,
  retryStrategy,
  reconnectOnError,
});

const parseRedisUrl = (redisUrl: string): RedisOptions => {
  const parsed = new URL(redisUrl);
  const dbFromPath = parsed.pathname ? Number(parsed.pathname.replace("/", "")) : undefined;

  return withResilience({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isFinite(dbFromPath) ? dbFromPath : env.REDIS_DB,
    ...(parsed.protocol === "rediss:" ? { tls: {} as Record<string, never> } : {}),
  });
};

export const redisConnectionOptions: ConnectionOptions = env.REDIS_URL
  ? parseRedisUrl(env.REDIS_URL)
  : withResilience({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      ...(env.REDIS_TLS ? { tls: {} as Record<string, never> } : {}),
    });
