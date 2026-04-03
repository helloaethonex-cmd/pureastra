import { z } from "zod";
import pino from "pino";

const bootstrapLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

const envBoolean = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5050),

  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),

  REDIS_URL: z.url().optional(),
  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_USERNAME: z.string().min(1).optional(),
  REDIS_PASSWORD: z.string().min(1).optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  REDIS_TLS: envBoolean.default(false),

  EMAIL_QUEUE_NAME: z.string().min(1).default("email"),
  EMAIL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  ORDER_RESERVATION_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  ORDER_RESERVATION_RELEASE_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  ORDER_RESERVATION_RELEASE_MAX_BATCHES: z.coerce.number().int().positive().default(50),
  ORDER_RESERVATION_SWEEP_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  ORDER_RESERVATION_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
  PAYMENT_PROVIDER_DEFAULT: z.string().trim().min(1).default("razorpay"),
  RAZORPAY_KEY_ID: z.string().trim().min(1),
  RAZORPAY_KEY_SECRET: z.string().trim().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().min(1),

  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().min(1),

  AUTH_VERIFY_EMAIL_CALLBACK_URL: z.url(),
  AUTH_RESET_PASSWORD_CALLBACK_URL: z.url(),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
}).superRefine((value, ctx) => {
  if (!value.REDIS_URL && (!value.REDIS_HOST || !value.REDIS_PORT)) {
    ctx.addIssue({
      code: "custom",
      message: "Provide REDIS_URL or both REDIS_HOST and REDIS_PORT",
      path: ["REDIS_URL"],
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  bootstrapLogger.error(
    { validation: z.flattenError(parsed.error) },
    "Invalid environment variables",
  );
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
export const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
  .map((v) => v.trim())
  .filter(Boolean);
