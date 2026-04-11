import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";

/**
 * Shared Cloudflare R2 client.
 * S3-compatible — reused by upload module and invoice PDF storage.
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ACCOUNT_ID
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials:
    env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export const R2_BUCKET = env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

/**
 * Upload a buffer to R2 and return the public URL.
 */
export const uploadBufferToR2 = async (
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${R2_PUBLIC_URL}/${key}`;
};
