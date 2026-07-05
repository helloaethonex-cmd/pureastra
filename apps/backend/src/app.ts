import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./modules/auth/better-auth";
import { env, trustedOrigins } from "./config/env";
import { requestLogger } from "./middlewares/request-logger";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error-handler";

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});

const referralLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: trustedOrigins,
    credentials: true,
  }),
);

app.use(requestLogger);
app.use(
  "/api/v1/payments/webhooks/razorpay",
  express.raw({ type: "application/json" }),
);
app.use(express.json());

app.use("/api/auth", authLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/docs/auth", (_req, res) => {
  return res.redirect("/api/auth/reference");
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Pureastra API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.use("/api/v1/checkout", checkoutLimiter);
app.use("/api/v1/upload", uploadLimiter);
app.use("/api/v1/influencers/validate-referral", referralLimiter);
app.use("/api/v1/", routes);

// Sentry error handler MUST be after routes but before custom error handlers
Sentry.setupExpressErrorHandler(app);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
