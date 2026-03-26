import { env } from "../../config/env";
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
    console.error("Email send failed", {
      to: input.to,
      subject: input.subject,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new Error("MAIL_SEND_FAILED");
  }
}
