import type { JwtPayload } from '../auth/jwt-payload';
import type { Session } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthNext?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | GoogleOAuthProfile;
      session: Session;
    }
  }
}

export {};
