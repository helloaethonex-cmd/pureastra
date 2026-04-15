import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { uploadImage, uploadReviewImage } from "./upload.controller";

const router = Router();
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// Store file in memory buffer (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, and AVIF images are allowed"));
    }
  },
});

/**
 * @openapi
 * /api/v1/upload/image:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload an image to Cloudflare R2
 *     description: >
 *       Uploads a product image to Cloudflare R2 and returns the public URL.
 *       Send the file as multipart/form-data with the field name `file`.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://pub-dummy.r2.dev/products/abc123.jpg"
 *       400:
 *         description: No file or invalid file type
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Upload failed
 */
router.post(
  "/image",
  requireAuth,
  requireRole("admin"),
  upload.single("file"),
  uploadImage
);

/**
 * @openapi
 * /api/v1/upload/review-image:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload a review image
 *     description: >
 *       Uploads a review image and returns the public URL.
 *       Send the file as multipart/form-data with the field name `file`.
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload successful
 *       400:
 *         description: No file or invalid file type
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Upload failed
 */
router.post("/review-image", requireAuth, upload.single("file"), uploadReviewImage);

export default router;
