import { auth } from "./better-auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
type ActiveSession = NonNullable<SessionResult>;

export type AuthUser = ActiveSession["user"];
export type AuthSession = ActiveSession["session"];
