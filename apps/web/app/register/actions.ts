"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { validateNickname } from "@/lib/nickname";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

function safeRedirectPath(path: string | undefined): string {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterEmailFormState = {
  error?: string;
};

export async function registerWithEmail(
  email: string,
  password: string,
  nickname: string,
): Promise<RegisterEmailFormState | void> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { error: "올바른 이메일 형식이 아닙니다." };
  }
  if (normalizedPassword.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const nicknameResult = validateNickname(nickname);
  if (!nicknameResult.ok) {
    return { error: nicknameResult.error };
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    return { error: "이미 사용중인 이메일입니다." };
  }

  const existingNickname = await prisma.user.findUnique({
    where: { nickname: nicknameResult.nickname },
  });
  if (existingNickname) {
    return { error: "이미 사용중인 닉네임입니다." };
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      nickname: nicknameResult.nickname,
    },
  });

  try {
    const signInResult = await signIn("credentials", {
      email: normalizedEmail,
      password: normalizedPassword,
      redirect: false,
    });
    if (signInResult?.error) {
      return {
        error: "가입은 완료됐지만 로그인에 실패했습니다. 로그인해 주세요.",
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "가입은 완료됐지만 로그인에 실패했습니다. 로그인해 주세요.",
      };
    }
    throw error;
  }
}

export async function registerAction(
  _prevState: RegisterEmailFormState,
  formData: FormData,
): Promise<RegisterEmailFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const nickname = String(formData.get("nickname") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (password.trim() !== passwordConfirm.trim()) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const result = await registerWithEmail(email, password, nickname);
  if (result?.error) {
    return result;
  }

  redirect(safeRedirectPath(redirectTo));
}
