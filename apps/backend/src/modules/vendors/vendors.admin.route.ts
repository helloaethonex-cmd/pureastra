import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  createVendorHandler,
  listVendorsHandler,
  getVendorHandler,
  updateVendorHandler,
  createWholesaleInvoiceHandler,
  listWholesaleInvoicesHandler,
  regenerateWholesaleInvoicePdfHandler,
  getWholesaleReportHandler,
  exportWholesaleReportCsvHandler,
} from "./vendors.controller";

const router = Router();
const adminGuard = [requireAuth, requireRole("admin")];

// ─── Wholesale invoices & report (specific paths before /:id) ─────────────────
router.get("/invoices", ...adminGuard, listWholesaleInvoicesHandler);
router.post(
  "/invoices/:invoiceId/regenerate-pdf",
  ...adminGuard,
  regenerateWholesaleInvoicePdfHandler,
);
router.get("/report", ...adminGuard, getWholesaleReportHandler);
router.get("/report/export", ...adminGuard, exportWholesaleReportCsvHandler);

// ─── Vendor CRUD ──────────────────────────────────────────────────────────────
router.post("/", ...adminGuard, createVendorHandler);
router.get("/", ...adminGuard, listVendorsHandler);
router.get("/:id", ...adminGuard, getVendorHandler);
router.put("/:id", ...adminGuard, updateVendorHandler);

// ─── Create wholesale invoice for a vendor ────────────────────────────────────
router.post("/:id/invoices", ...adminGuard, createWholesaleInvoiceHandler);

export default router;
