import { z } from "zod";

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
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_USERNAME: z.string().min(1).optional(),
  REDIS_PASSWORD: z.string().min(1).optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  REDIS_TLS: envBoolean.default(false),

  EMAIL_QUEUE_NAME: z.string().min(1).default("email"),
  EMAIL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),

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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error));
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
export const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
  .map((v) => v.trim())
  .filter(Boolean);
