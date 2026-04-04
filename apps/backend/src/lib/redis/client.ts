import Redis, { RedisOptions } from "ioredis";
import { logger } from "../logger";
import { redisConnectionOptions } from "./connection";

declare global {
  // eslint-disable-next-line no-var
  var __pureastraRedisClient: Redis | undefined;
}

const buildClient = () => {
  const client = new Redis(redisConnectionOptions as RedisOptions);

  client.on("error", (error) => {
    logger.error({ err: error }, "Redis client error");
  });

  return client;
};

export const redisClient = global.__pureastraRedisClient ?? buildClient();

if (!global.__pureastraRedisClient) {
  global.__pureastraRedisClient = redisClient;
}

