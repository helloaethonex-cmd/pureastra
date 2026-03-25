import { AuthUser, AuthSession } from "../../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: AuthSession;
    }
  }
}

export {};
