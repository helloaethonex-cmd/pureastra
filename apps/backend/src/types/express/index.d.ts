import { AuthUser, AuthSession } from "../../modules/auth/auth.types";
import { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: AuthSession;
      id?: string;
      log: Logger;
      requestId?: string;
    }
  }
}

export {};
