import { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "pureastra-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://pub-dummy.r2.dev";

const uploadToR2 = async (file: Express.Multer.File, keyPrefix: string) => {
  const ext = file.originalname.split(".").pop() ?? "jpg";
  const key = `${keyPrefix}/${uuidv4()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `${PUBLIC_URL}/${key}`;
};

/**
 * POST /api/v1/upload/image
 * Accepts multipart/form-data with field "file"
 * Returns { url: string }
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const url = await uploadToR2(file, "products");
    res.status(200).json({ url });
  } catch (err: any) {
    console.error("[upload] R2 error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

/**
 * POST /api/v1/upload/review-image
 * Accepts multipart/form-data with field "file"
 * Returns { url: string }
 */
export const uploadReviewImage = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const url = await uploadToR2(file, "reviews");
    res.status(200).json({ url });
  } catch (err: any) {
    console.error("[upload:review] R2 error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};
