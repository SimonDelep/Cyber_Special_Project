import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/event-log";

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email ou nom d’utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          await logEvent({
            type: "auth.login_attempt",
            severity: "WARN",
            message: "Login attempt with invalid payload",
          });
          return null;
        }

        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
          },
        });
        if (!user) {
          await logEvent({
            type: "auth.login_failed",
            severity: "WARN",
            message: "Login failed: user not found",
            metadata: { identifier },
          });
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await logEvent({
            type: "auth.login_failed",
            severity: "WARN",
            message: "Login failed: wrong password",
            userId: user.id,
            metadata: { identifier },
          });
          return null;
        }

        await logEvent({
          type: "auth.login_success",
          severity: "INFO",
          message: "Login successful",
          userId: user.id,
        });

        // NextAuth will pass this object to the `jwt` callback as `user`.
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          points: user.points,
          balance: Number(user.balance),
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Only enrich token on first sign-in (when `user` exists).
      if (user) {
        const userAny = user as unknown as { role?: "USER" | "ADMIN"; points?: number; balance?: number };
        (token as unknown as { role?: "USER" | "ADMIN"; points?: number; balance?: number }).role =
          userAny.role;
        (token as unknown as { role?: "USER" | "ADMIN"; points?: number; balance?: number }).points =
          userAny.points;
        (token as unknown as { role?: "USER" | "ADMIN"; points?: number; balance?: number }).balance =
          userAny.balance;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;
      if (token.sub) session.user.id = token.sub;

      if (typeof token.name === "string") session.user.name = token.name;
      const tokenAny = token as unknown as { role?: "USER" | "ADMIN"; points?: number; balance?: number };
      if (tokenAny.role) session.user.role = tokenAny.role;
      if (typeof tokenAny.points === "number") session.user.points = tokenAny.points;
      if (typeof tokenAny.balance === "number") session.user.balance = tokenAny.balance;

      return session;
    },
  },
};

// Server-side helper (used in layouts/components/actions).
export async function auth() {
  return getServerSession(authOptions);
}

// Convenience export for the route handler.
export const NextAuthHandler = NextAuth(authOptions);

