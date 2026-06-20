"use server";

import { signIn } from "@/auth";

function safeRedirectPath(path: string | undefined): string {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

export async function signInWithGoogle(redirectTo?: string) {
  await signIn("google", { redirectTo: safeRedirectPath(redirectTo) });
}
