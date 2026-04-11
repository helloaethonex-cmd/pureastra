import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  exportGstReportCsv,
  getGstReport,
  getOverviewReport,
} from "./reports.controller";

const router = Router();

router.get("/gst", requireAuth, requireRole("admin"), getGstReport);
router.get(
  "/gst/export",
  requireAuth,
  requireRole("admin"),
  exportGstReportCsv,
);
router.get("/overview", requireAuth, requireRole("admin"), getOverviewReport);

export default router;
