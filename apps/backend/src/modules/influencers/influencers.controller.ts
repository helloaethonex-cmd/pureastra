import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  adminCreateInfluencer,
  adminListInfluencers,
  adminGetInfluencer,
  adminUpdateInfluencerStatus,
  adminUpdateCommissionRate,
  adminUpdateDashboardAccess,
  adminListSalesForInfluencer,
  adminUpdateSaleStatus,
  adminRecordPayout,
  adminListPayoutsForInfluencer,
  adminUpdatePayoutStatus,
  adminLinkInfluencerUser,
  getInfluencerDashboard,
  getAdminAnalytics,
  validateReferralCode,
} from "./influencers.service";
import {
  createInfluencerSchema,
  listInfluencersSchema,
  updateInfluencerStatusSchema,
  updateCommissionRateSchema,
  updateDashboardAccessSchema,
  listSalesSchema,
  updateSaleStatusSchema,
  recordPayoutSchema,
  listPayoutsSchema,
  updatePayoutStatusSchema,
  linkUserSchema,
  analyticsQuerySchema,
  validateRefSchema,
} from "./influencers.types";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Invalid request payload", details: err.issues });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate entry — email or referral code already exists",
        code: "DUPLICATE_INFLUENCER",
      });
    }
  }

  req.log.error({ err }, "Influencer operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Influencer CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const createInfluencer = async (req: Request, res: Response) => {
  try {
    const input = createInfluencerSchema.parse(req.body);
    const result = await adminCreateInfluencer(input);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const listInfluencers = async (req: Request, res: Response) => {
  try {
    const input = listInfluencersSchema.parse(req.query);
    const result = await adminListInfluencers(input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getInfluencer = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await adminGetInfluencer(id);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateInfluencerStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = updateInfluencerStatusSchema.parse(req.body);
    const result = await adminUpdateInfluencerStatus(id, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateCommissionRate = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = updateCommissionRateSchema.parse(req.body);
    const result = await adminUpdateCommissionRate(id, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateDashboardAccess = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = updateDashboardAccessSchema.parse(req.body);
    const result = await adminUpdateDashboardAccess(id, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Sales
// ─────────────────────────────────────────────────────────────────────────────

export const listSales = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = listSalesSchema.parse(req.query);
    const result = await adminListSalesForInfluencer(id, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateSaleStatus = async (req: Request, res: Response) => {
  try {
    const saleId = String(req.params.saleId);
    const input = updateSaleStatusSchema.parse(req.body);
    const result = await adminUpdateSaleStatus(saleId, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Payouts
// ─────────────────────────────────────────────────────────────────────────────

export const recordPayout = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = recordPayoutSchema.parse(req.body);
    const result = await adminRecordPayout(id, input);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const listPayouts = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = listPayoutsSchema.parse(req.query);
    const result = await adminListPayoutsForInfluencer(id, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updatePayoutStatus = async (req: Request, res: Response) => {
  try {
    const payoutId = String(req.params.payoutId);
    const input = updatePayoutStatusSchema.parse(req.body);
    const result = await adminUpdatePayoutStatus(payoutId, input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Validate referral code
// ─────────────────────────────────────────────────────────────────────────────

export const validateRef = async (req: Request, res: Response) => {
  try {
    const { code } = validateRefSchema.parse(req.query);
    const result = await validateReferralCode(code);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER DASHBOARD (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

export const getMyDashboard = async (req: Request, res: Response) => {
  try {
    const result = await getInfluencerDashboard(req.user!.id);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Analytics
// ─────────────────────────────────────────────────────────────────────────────

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const input = analyticsQuerySchema.parse(req.query);
    const result = await getAdminAnalytics(input);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const linkUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const input = linkUserSchema.parse(req.body);
    const result = await adminLinkInfluencerUser(id, input);
    return res.status(200).json(result);
  } catch (err) {
    // P2002 = userId already linked to another influencer
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({
        error: "This user is already linked to another influencer",
        code: "USER_ALREADY_LINKED",
      });
    }
    return handleError(req, res, err);
  }
};

