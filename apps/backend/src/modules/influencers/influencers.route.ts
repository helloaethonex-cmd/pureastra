import { Router } from "express";
import { validateRef } from "./influencers.controller";

const router = Router();

/**
 * GET /api/v1/influencers/validate-ref?code=ALICE
 * Public, no auth required.
 * Returns { valid: true, name, referralCode } or { valid: false }.
 * Frontend calls this pre-checkout to show influencer attribution UI.
 */
router.get("/validate-ref", validateRef);

export default router;
