import type { OAuthProvider } from 'src/generated/prisma/enums';

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
};
