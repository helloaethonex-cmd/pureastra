import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { uploadImage } from "./upload.controller";

const router = Router();

// Store file in memory buffer (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
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

export default router;
