import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  exportGstReportCsv,
  getGstReport,
  getOverviewReport,
} from "./reports.controller";
import {
  listManualInvoicesHandler,
  createManualInvoiceHandler,
  updateManualInvoiceHandler,
} from "./manual-invoices.controller";

const router = Router();

router.get("/gst", requireAuth, requireRole("admin"), getGstReport);
router.get("/gst/export", requireAuth, requireRole("admin"), exportGstReportCsv);
router.get("/overview", requireAuth, requireRole("admin"), getOverviewReport);

router.get("/manual-invoices", requireAuth, requireRole("admin"), listManualInvoicesHandler);
router.post("/manual-invoices", requireAuth, requireRole("admin"), createManualInvoiceHandler);
router.put("/manual-invoices/:id", requireAuth, requireRole("admin"), updateManualInvoiceHandler);

export default router;
