import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/generated/prisma/enums";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProfile = nextUrl.pathname.startsWith("/profile");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnProfile && !isLoggedIn) {
        return false;
      }

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (auth.user.role !== "ADMIN") {
          return Response.redirect(
            new URL("/profile?error=unauthorized", nextUrl),
          );
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as Role;
        session.user.image = (token.picture as string | null) ?? undefined;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
