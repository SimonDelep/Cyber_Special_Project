import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";
import { logSystemEvent } from "@/lib/monitoring/logger";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        const usernameRaw = String(credentials?.username ?? "").trim().toLowerCase();

        await logSystemEvent({
          type: "LOGIN_ATTEMPT",
          message: `Login attempt for username "${usernameRaw || "unknown"}".`,
          username: usernameRaw || null,
        });

        if (!parsed.success) {
          await logSystemEvent({
            type: "LOGIN_FAILURE",
            severity: "WARNING",
            message: "Login failed: invalid credentials payload.",
            username: usernameRaw || null,
            metadata: { reason: "invalid_input" },
          });
          return null;
        }

        const username = parsed.data.username.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          await logSystemEvent({
            type: "LOGIN_FAILURE",
            severity: "WARNING",
            message: `Login failed: unknown user "${username}".`,
            username,
            metadata: { reason: "unknown_user" },
          });
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          await logSystemEvent({
            type: "LOGIN_FAILURE",
            severity: "WARNING",
            message: `Login failed: incorrect password for "${username}".`,
            userId: user.id,
            username,
            metadata: { reason: "invalid_password" },
          });
          return null;
        }

        await logSystemEvent({
          type: "LOGIN_SUCCESS",
          message: `User "${username}" signed in successfully.`,
          userId: user.id,
          username,
        });

        return {
          id: user.id,
          name: user.name ?? user.username,
          email: user.email,
          image: user.profileImageUrl,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: Role }).role;
        token.username = (user as { username: string }).username;
        token.name = user.name;
        token.picture = user.image;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name !== undefined) token.name = session.user.name;
        if (session.user.image !== undefined) token.picture = session.user.image;
        if (session.user.role !== undefined) token.role = session.user.role as Role;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id as string,
          role: token.role as Role,
          username: token.username as string,
          name: (token.name as string | null | undefined) ?? null,
          email: token.email != null ? String(token.email) : null,
          image: (token.picture as string | null | undefined) ?? null,
        },
      };
    },
  },
});
