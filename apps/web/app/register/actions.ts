"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import bcrypt from "bcryptjs";

function safeRedirectPath(path: string | undefined): string {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

export async function registerWithEmail(
  email: string,
  password: string,
  redirectTo?: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("이메일과 비밀번호를 입력해 주세요.");
  }
  if (normalizedPassword.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error("이미 사용중인 이메일입니다.");
  }

  const salt = 10;
  const passwordHash = await bcrypt.hash(normalizedPassword, salt);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  });

  await signIn("credentials", {
    email: normalizedEmail,
    password: normalizedPassword,
    redirectTo: safeRedirectPath(redirectTo),
  });
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  if (password.trim() !== passwordConfirm.trim()) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }
  await registerWithEmail(email, password, redirectTo);
}
