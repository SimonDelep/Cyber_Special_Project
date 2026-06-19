import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [],
  callbacks: {
    // Required for middleware (Edge): maps JWT fields onto session.user (incl. role).
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: Role }).role;
        token.username = (user as { username: string }).username;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
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
} satisfies NextAuthConfig;