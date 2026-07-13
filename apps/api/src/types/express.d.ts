import type { JwtPayload } from '../auth/jwt-payload';
import type { OAuthProfile } from '../auth/oauth-profile';
import type { Session } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthNext?: string;
  }
}

declare global {
  namespace Express {
    interface User extends JwtPayload {}
    interface Request {
      session: Session;
    }
  }
}

export {};
