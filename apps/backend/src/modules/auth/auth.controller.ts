import { Request, Response } from "express";
import { env } from "../../config/env";
import { forgotPasswordBodySchema } from "./auth.types";
import { requestPasswordReset } from "./auth.service";

const FORGOT_PASSWORD_RESPONSE = {
  success: true,
  message:
    "If an account exists for this email, a password reset link will be sent.",
};

export const forgotPassword = async (req: Request, res: Response) => {
  const parsedBody = forgotPasswordBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsedBody.error.flatten(),
    });
  }

  const redirectTo =
    parsedBody.data.redirectTo ?? env.AUTH_RESET_PASSWORD_CALLBACK_URL;

  try {
    await requestPasswordReset({
      email: parsedBody.data.email,
      redirectTo,
    });
  } catch (error) {
    req.log.error({
      email: parsedBody.data.email,
      err: error,
    }, "Forgot password request failed");
  }

  return res.status(200).json(FORGOT_PASSWORD_RESPONSE);
};
