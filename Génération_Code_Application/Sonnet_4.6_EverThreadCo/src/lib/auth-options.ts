import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          await logEvent({
            category: "AUTH",
            action: EventActions.LOGIN_FAILED,
            severity: "WARN",
            message: `Login failed for unknown username "${username}"`,
            username,
            metadata: { username },
          });
          return null;
        }

        const valid = await verifyPassword(
          credentials.password,
          user.passwordHash,
        );
        if (!valid) {
          await logEvent({
            category: "AUTH",
            action: EventActions.LOGIN_FAILED,
            severity: "WARN",
            message: `Login failed: invalid password for @${user.username}`,
            userId: user.id,
            username: user.username,
            metadata: { username: user.username },
          });
          return null;
        }

        return {
          id: user.id,
          name: user.displayName ?? user.username,
          email: user.email,
          image: user.avatarUrl,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
          bio: user.bio,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      await logEvent({
        category: "AUTH",
        action: EventActions.LOGIN_SUCCESS,
        message: `User @${user.username ?? user.id} signed in`,
        userId: user.id,
        username: (user as { username?: string }).username ?? null,
        metadata: { userId: user.id },
      });
    },
    async signOut({ token }) {
      const userId = (token?.id ?? token?.sub) as string | undefined;
      await logEvent({
        category: "AUTH",
        action: EventActions.LOGOUT,
        message: userId
          ? `User session ended (${userId})`
          : "User session ended",
        userId: userId ?? null,
        username: (token?.username as string | undefined) ?? null,
      });
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.displayName = user.displayName;
        token.bio = user.bio;
        token.picture = user.image;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.picture = session.user.image ?? token.picture;
        if (session.user.displayName !== undefined) {
          token.displayName = session.user.displayName;
        }
        if (session.user.bio !== undefined) {
          token.bio = session.user.bio;
        }
      }

      const userId = (token.id ?? token.sub) as string | undefined;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            username: true,
            role: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            email: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.displayName = dbUser.displayName;
          token.bio = dbUser.bio;
          token.picture = dbUser.avatarUrl;
          token.email = dbUser.email;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role;
        session.user.displayName = (token.displayName as string | null) ?? null;
        session.user.bio = (token.bio as string | null) ?? null;
        session.user.name = token.name ?? session.user.username;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
};
