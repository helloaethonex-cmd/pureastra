import path from "path";

export type EmailTemplateName =
  | "order-confirmation"
  | "order-shipped"
  | "feedback-request";

export async function renderEmailTemplate(
  templateName: EmailTemplateName,
  data: Record<string, unknown>,
): Promise<string> {
  const ejs = await import("ejs");
  const templatePath = path.join(__dirname, "templates", `${templateName}.ejs`);
  return ejs.renderFile(templatePath, data);
}
