import { auth } from "@/auth";
import { SignJWT } from "jose";
import "server-only";

export async function getApiAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const secretValue = process.env.API_JWT_SECRET;
  if (!secretValue) {
    throw new Error("API_JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }

  const secret = new TextEncoder().encode(secretValue);
  return new SignJWT({ role: session.user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setExpirationTime("7d")
    .sign(secret);
}
