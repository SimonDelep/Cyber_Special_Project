import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config (no Prisma/bcrypt).
 * Used by middleware; full auth with DB lives in auth.ts.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.balanceCents = user.balanceCents;
        token.avatarUrl = user.avatarUrl ?? null;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        if (typeof session.user.balanceCents === "number") {
          token.balanceCents = session.user.balanceCents;
        }
        if ("avatarUrl" in session.user) {
          token.avatarUrl = session.user.avatarUrl ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as Role,
        balanceCents: token.balanceCents as number,
        avatarUrl: (token.avatarUrl as string | null | undefined) ?? null,
        emailVerified: null,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
