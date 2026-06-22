"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateNickname } from "@/lib/nickname";

export type ProfileFormState = { error?: string; success?: boolean };

export async function updateNicknameAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인 후 이용해 주세요." };
  }
  const nickname = String(formData.get("nickname") ?? "");
  const nicknameResult = validateNickname(nickname);
  if (!nicknameResult.ok) {
    return { error: nicknameResult.error };
  }

  const existingNickname = await prisma.user.findUnique({
    where: { nickname: nicknameResult.nickname },
  });
  if (existingNickname && existingNickname.id !== session.user.id) {
    return { error: "이미 사용중인 닉네임입니다." };
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname: nicknameResult.nickname },
  });
  return { success: true };
}
