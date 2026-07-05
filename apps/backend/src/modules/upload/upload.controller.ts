import { Request, Response } from "express";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { uploadBufferToR2 } from "../../lib/r2";
import { logger } from "../../lib/logger";

const PRODUCT_HERO_SIZE = 1200;
const PRODUCT_THUMB_SIZE = 240;
const PRODUCT_PLACEHOLDER_SIZE = 24;
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

type UploadedProductImage = {
  url: string;
  heroImageUrl: string;
  thumbnailImageUrl: string;
  width: number;
  height: number;
  placeholder: string;
};

// Validate image magic bytes — cannot be spoofed by client-supplied Content-Type
const isValidImageBuffer = (buf: Buffer): boolean => {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF: 47 49 46
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  // AVIF/HEIF: ftyp box at offset 4; check major brand at 8-11 to exclude MP4/MOV/M4A
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString("ascii");
    if (["avif", "avis", "heic", "heix", "mif1"].includes(brand)) return true;
  }
  return false;
};

const processAndUploadProductImage = async (
  file: Express.Multer.File,
): Promise<UploadedProductImage> => {
  const image = sharp(file.buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();

  const width = metadata.width ?? PRODUCT_HERO_SIZE;
  const height = metadata.height ?? PRODUCT_HERO_SIZE;

  const [heroBuffer, thumbnailBuffer, placeholderBuffer] = await Promise.all([
    image
      .clone()
      .resize({
        width: PRODUCT_HERO_SIZE,
        height: PRODUCT_HERO_SIZE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 84,
        effort: 6,
      })
      .toBuffer(),
    image
      .clone()
      .resize({
        width: PRODUCT_THUMB_SIZE,
        height: PRODUCT_THUMB_SIZE,
        fit: "cover",
      })
      .webp({
        quality: 78,
        effort: 6,
      })
      .toBuffer(),
    image
      .clone()
      .resize({
        width: PRODUCT_PLACEHOLDER_SIZE,
        height: PRODUCT_PLACEHOLDER_SIZE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 45,
        effort: 4,
      })
      .toBuffer(),
  ]);

  const baseKey = `${uuidv4()}`;
  const [heroImageUrl, thumbnailImageUrl] = await Promise.all([
    uploadBufferToR2(`products/hero/${baseKey}.webp`, heroBuffer, "image/webp", {
      cacheControl: IMAGE_CACHE_CONTROL,
    }),
    uploadBufferToR2(
      `products/thumb/${baseKey}.webp`,
      thumbnailBuffer,
      "image/webp",
      {
        cacheControl: IMAGE_CACHE_CONTROL,
      },
    ),
  ]);

  return {
    url: heroImageUrl,
    heroImageUrl,
    thumbnailImageUrl,
    width,
    height,
    placeholder: `data:image/webp;base64,${placeholderBuffer.toString("base64")}`,
  };
};

/**
 * POST /api/v1/upload/image
 * Accepts multipart/form-data with field "file"
 * Returns optimized image metadata
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!isValidImageBuffer(file.buffer)) {
      return res.status(400).json({ error: "Invalid image file" });
    }

    const uploaded = await processAndUploadProductImage(file);
    res.status(200).json(uploaded);
  } catch (err: any) {
    logger.error({ err }, "[upload] R2 error");
    res.status(500).json({ error: "Upload failed" });
  }
};

const REVIEW_IMAGE_MAX_SIZE = 1200;

const processAndUploadReviewImage = async (
  file: Express.Multer.File,
): Promise<string> => {
  const buffer = await sharp(file.buffer, { failOn: "none" })
    .rotate()
    .resize({ width: REVIEW_IMAGE_MAX_SIZE, height: REVIEW_IMAGE_MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const key = `reviews/${uuidv4()}.webp`;
  return uploadBufferToR2(key, buffer, "image/webp", { cacheControl: IMAGE_CACHE_CONTROL });
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

    if (!isValidImageBuffer(file.buffer)) {
      return res.status(400).json({ error: "Invalid image file" });
    }

    const url = await processAndUploadReviewImage(file);
    res.status(200).json({ url });
  } catch (err: any) {
    logger.error({ err }, "[upload:review] R2 error");
    res.status(500).json({ error: "Upload failed" });
  }
};
