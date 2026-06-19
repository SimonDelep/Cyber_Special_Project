import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async signIn({ user }) {
      await logEvent({
        category: "AUTH",
        action: LogAction.LOGIN_SUCCESS,
        message: `Successful login for user "${user.username ?? user.id}"`,
        userId: user.id,
        username: user.username ?? undefined,
        success: true,
      });
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      await logEvent({
        category: "AUTH",
        action: LogAction.LOGOUT,
        message: `User signed out`,
        userId: (token?.id as string | undefined) ?? null,
        username: (token?.username as string | undefined) ?? null,
        success: true,
      });
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          await logEvent({
            category: "AUTH",
            action: LogAction.LOGIN_FAILURE,
            message: "Login failed: invalid credentials payload",
            success: false,
          });
          return null;
        }

        const user = await db.user.findUnique({
          where: { username: parsed.data.username },
        });
        if (!user) {
          await logEvent({
            category: "AUTH",
            action: LogAction.LOGIN_FAILURE,
            message: `Login failed: unknown username "${parsed.data.username}"`,
            username: parsed.data.username,
            success: false,
          });
          return null;
        }

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) {
          await logEvent({
            category: "AUTH",
            action: LogAction.LOGIN_FAILURE,
            message: `Login failed: invalid password for "${user.username}"`,
            userId: user.id,
            username: user.username,
            success: false,
          });
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
});
