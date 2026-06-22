"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

function safeRedirectPath(path: string | undefined): string {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

export type LoginEmailFormState = { error?: string };

export async function signInWithGoogle(redirectTo?: string) {
  await signIn("google", { redirectTo: safeRedirectPath(redirectTo) });
}

export async function signInWithEmailAction(
  _preState: LoginEmailFormState,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("이메일과 비밀번호를 입력해 주세요.");
  }

  try {
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password: normalizedPassword,
      redirect: false,
    });
    if (result?.error) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }
    throw error;
  }
  redirect(safeRedirectPath(redirectTo));
}
