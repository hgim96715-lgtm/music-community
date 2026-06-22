import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { User } from "../api/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  suggestNicknameFromEmail,
  withNicknameSuffix,
} from "./lib/nickname";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string"
            ? credentials.password.trim()
            : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok ? user : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as User;
        token.sub = dbUser.id;
        token.role = dbUser.role;

        // 소셜 최초 로그인 - nickname 없으면 이메일 @ 앞부분 추출
        // 중복된 nickname 있으면 숫자 붙여서 중복 방지
        if (!dbUser.nickname && dbUser.email) {
          const base = suggestNicknameFromEmail(dbUser.email);
          let nickname = base;
          let suffix = 2;
          while (await prisma.user.findUnique({ where: { nickname } })) {
            nickname = withNicknameSuffix(base, suffix);
            suffix += 1;
          }

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { nickname },
          });
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as User["role"];
      }
      return session;
    },
  },
});
