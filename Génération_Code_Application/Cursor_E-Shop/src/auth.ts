import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import {
  AuditAction,
  getAuditRequestMeta,
  logAuditEvent,
} from "@/lib/audit";
import { isPrismaUnavailable } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    role: Role;
    balanceCents: number;
    avatarUrl?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      balanceCents: number;
      avatarUrl: string | null;
      emailVerified: Date | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    balanceCents: number;
    avatarUrl?: string | null;
  }
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const { ipAddress } = await getAuditRequestMeta();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            await logAuditEvent({
              action: AuditAction.LOGIN_FAILURE,
              severity: "WARN",
              userEmail: email,
              ipAddress,
              details: { reason: "user_not_found" },
            });
            return null;
          }

          const valid = await compare(parsed.data.password, user.passwordHash);
          if (!valid) {
            await logAuditEvent({
              action: AuditAction.LOGIN_FAILURE,
              severity: "WARN",
              userId: user.id,
              userEmail: user.email,
              ipAddress,
              details: { reason: "invalid_password" },
            });
            return null;
          }

          await logAuditEvent({
            action: AuditAction.LOGIN_SUCCESS,
            userId: user.id,
            userEmail: user.email,
            ipAddress,
            details: { role: user.role },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            balanceCents: user.balanceCents,
            avatarUrl: user.avatarUrl,
          };
        } catch (err) {
          if (isPrismaUnavailable(err)) {
            throw new Error("DATABASE_UNAVAILABLE");
          }
          return null;
        }
      },
    }),
  ],
});
