import { env } from "../../config/env";
import { logger } from "../logger";
import { mailTransporter } from "./transport";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(input: SendMailInput): Promise<void> {
  try {
    await mailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  } catch (error) {
    logger.error({
      to: input.to,
      subject: input.subject,
      err: error,
    }, "Email send failed");
    throw new Error("MAIL_SEND_FAILED", { cause: error });
  }
}
