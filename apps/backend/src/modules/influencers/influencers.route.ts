import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { validateRef, getMyDashboard } from "./influencers.controller";

const router = Router();

/**
 * GET /api/v1/influencers/validate-ref?code=ALICE
 * Public, no auth required.
 */
router.get("/validate-ref", validateRef);

/**
 * GET /api/v1/influencers/me/dashboard
 * Requires auth. Influencer must have canViewDashboard = true.
 * Resolves influencer via userId FK on the Influencer model.
 */
router.get("/me/dashboard", requireAuth, getMyDashboard);

export default router;
