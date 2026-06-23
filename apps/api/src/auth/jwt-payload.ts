export type JwtPayload = {
  sub: string;
  role: 'user' | 'admin';
};
