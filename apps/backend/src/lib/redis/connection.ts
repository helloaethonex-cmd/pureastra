import { ConnectionOptions } from "bullmq";
import { env } from "../../config/env";

export const redisConnectionOptions: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null,
  ...(env.REDIS_TLS ? { tls: {} as Record<string, never> } : {}),
};
