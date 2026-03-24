import { z } from "zod";
import { auth } from "./better-auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
type ActiveSession = NonNullable<SessionResult>;

export type AuthUser = ActiveSession["user"];
export type AuthSession = ActiveSession["session"];

export const forgotPasswordBodySchema = z.object({
  email: z.email(),
  redirectTo: z.url().optional(),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
